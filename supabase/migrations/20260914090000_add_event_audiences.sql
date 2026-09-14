-- Phase 3, step 1 of 2: let one event serve several audiences, e.g. adults and youth together.
--
-- Deploy-safe on purpose. `events.audience` stays, and a trigger keeps it in sync with the new
-- `events.audiences` array, so the currently deployed build (which reads and writes `audience`) and
-- the new build (which uses `audiences`) both work while the deploy rolls out.
-- Step 2, which drops `audience` and the trigger, runs only once the new build is confirmed live.
--
-- Supersedes supabase/migration-drafts/20260819210000_allow_multiselect_event_audience.sql, which
-- stored the same idea as a comma-separated string.

-- 1. The new column, backfilled from the single value every existing row already has.

alter table public.events
  add column audiences text[];

update public.events
set audiences = array[audience];

alter table public.events
  alter column audiences set not null;

alter table public.events
  add constraint events_audiences_not_empty
    check (cardinality(audiences) > 0),
  add constraint events_audiences_valid
    check (audiences <@ array['adults', 'youth', 'children']::text[]);

comment on column public.events.audiences is
  'One or more audiences the event serves. A single-audience event holds a one-element array.';

comment on column public.events.audience is
  'Deprecated, kept in sync by private.sync_event_audiences during the multi-audience deploy. Dropped in step 2.';

-- 2. The sync trigger. A writer supplies whichever column its build knows about; the other is
-- derived. `audience` can only hold one value, so a multi-audience event presents its first
-- audience to the old build — which is correct enough for the short window in which both run.
-- Both columns stay `not null`: a before-insert trigger fills the missing one before that is
-- checked.

create function private.sync_event_audiences()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.audiences is null and new.audience is not null then
      new.audiences := array[new.audience];
    elsif new.audience is null and new.audiences is not null then
      new.audience := new.audiences[1];
    end if;
  elsif new.audiences is distinct from old.audiences then
    new.audience := new.audiences[1];
  elsif new.audience is distinct from old.audience then
    new.audiences := array[new.audience];
  end if;

  return new;
end;
$$;

create trigger events_sync_audiences
before insert or update of audience, audiences on public.events
for each row
execute function private.sync_event_audiences();

alter table public.events
  alter column audience drop not null;

-- 3. Registration rules now read the array.
--
-- `registrations.participant_age` is constrained to 6-17 or null, so an age is a minor's age and an
-- adult registration never carries one. The shape of the submission therefore says which kind of
-- registration it is, and the event's audience set says whether that kind is allowed:
--
--   * age is null      -> adult registration; permitted only if the event includes 'adults',
--                         and guardian details must be absent.
--   * age is present   -> minor registration; permitted only if the age falls inside the range of
--                         one of the event's own minor audiences ('children' 6-12, 'youth' 13-17),
--                         and guardian name plus consent are required.
--
-- For a single-audience event this is exactly the behaviour that is live today, including which of
-- the two error messages is raised. For a mixed event such as adults + youth, an adult registers
-- with no age and a 15-year-old registers with an age and a guardian. An age of 15 on an
-- adults + children event is refused, because 15 is in no selected audience's range.

create or replace function private.register_for_event(
  p_event_id uuid,
  p_attendee_name text,
  p_phone_e164 text,
  p_email text,
  p_guardian_name text,
  p_participant_age integer,
  p_guardian_consent boolean,
  p_booking_token_hash text
)
returns table (
  registration_reference uuid,
  registration_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_event public.events%rowtype;
  normalized_name text := btrim(p_attendee_name);
  normalized_email text := nullif(lower(btrim(p_email)), '');
  normalized_guardian_name text := nullif(btrim(p_guardian_name), '');
  active_count integer;
  selected_status text;
begin
  if length(normalized_name) not between 2 and 120
    or p_phone_e164 !~ '^\+9665[0-9]{8}$'
    or p_booking_token_hash !~ '^[0-9a-f]{64}$'
    or (
      normalized_email is not null
      and (
        length(normalized_email) > 254
        or normalized_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      )
    )
  then
    raise sqlstate 'P0001' using message = 'invalid_registration';
  end if;

  select *
  into selected_event
  from public.events
  where id = p_event_id
  for update;

  if not found
    or selected_event.publication_status <> 'published'
    or selected_event.registration_status <> 'open'
    or selected_event.starts_at <= now()
    or selected_event.ends_at is null
    or selected_event.price_halalas is null
  then
    raise sqlstate 'P0001' using message = 'event_unavailable';
  end if;

  if p_participant_age is null then
    -- An adult registration. On a minors-only event this is the missing-age case, which stays
    -- 'minor_registration_invalid' as it is today.
    if not ('adults' = any (selected_event.audiences)) then
      raise sqlstate 'P0001' using message = 'minor_registration_invalid';
    end if;

    if normalized_guardian_name is not null or p_guardian_consent is true then
      raise sqlstate 'P0001' using message = 'invalid_registration';
    end if;
  else
    -- A minor registration. On an adults-only event this is the age-supplied case, which stays
    -- 'invalid_registration' as it is today.
    if not (selected_event.audiences && array['youth', 'children']::text[]) then
      raise sqlstate 'P0001' using message = 'invalid_registration';
    end if;

    if not exists (
      select 1
      from unnest(selected_event.audiences) as audience
      where (audience = 'children' and p_participant_age between 6 and 12)
        or (audience = 'youth' and p_participant_age between 13 and 17)
    )
      or normalized_guardian_name is null
      or length(normalized_guardian_name) not between 2 and 120
      or p_guardian_consent is not true
    then
      raise sqlstate 'P0001' using message = 'minor_registration_invalid';
    end if;
  end if;

  -- Keyed on the shape of this submission rather than the event, so a mixed event applies the adult
  -- rule to adults and the minor rule to minors.
  if exists (
    select 1
    from public.registrations
    where event_id = p_event_id
      and (
        (
          p_participant_age is null
          and participant_age is null
          and (
            phone_e164 = p_phone_e164
            or (normalized_email is not null and lower(email) = normalized_email)
          )
        )
        or (
          p_participant_age is not null
          and participant_age is not null
          and phone_e164 = p_phone_e164
          and lower(attendee_name) = lower(normalized_name)
        )
      )
  ) then
    raise sqlstate 'P0001' using message = 'duplicate_registration';
  end if;

  perform private.expire_waitlist_invitations(p_event_id);

  select count(*)::integer
  into active_count
  from public.registrations
  where event_id = p_event_id
    and (
      status = 'registered'
      or (status = 'invited' and invitation_expires_at > now())
    );

  selected_status := case
    when active_count < selected_event.capacity then 'registered'
    else 'waitlisted'
  end;

  return query
  insert into public.registrations (
    event_id,
    attendee_name,
    phone_e164,
    email,
    participant_age,
    guardian_name,
    guardian_consent,
    status,
    price_halalas_at_booking,
    booking_token_hash,
    retention_until
  )
  values (
    p_event_id,
    normalized_name,
    p_phone_e164,
    normalized_email,
    p_participant_age,
    normalized_guardian_name,
    coalesce(p_guardian_consent, false),
    selected_status,
    selected_event.price_halalas,
    p_booking_token_hash,
    selected_event.ends_at + interval '90 days'
  )
  returning public_reference, status;
exception
  when unique_violation then
    raise sqlstate 'P0001' using message = 'duplicate_registration';
end;
$$;
