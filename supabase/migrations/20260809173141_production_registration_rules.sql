alter table public.events
  add column registration_status text;

update public.events
set registration_status = case availability
  when 'full' then 'closed'
  else 'open'
end;

alter table public.events
  alter column registration_status set default 'open',
  alter column registration_status set not null,
  add constraint events_registration_status_valid
    check (registration_status in ('open', 'closed'));

comment on column public.events.registration_status is
  'Administrator control for accepting new registrations. Capacity availability is derived from active reservations.';

alter table public.registrations
  add column participant_age smallint,
  add column guardian_name text,
  add column price_halalas_at_booking integer,
  add column booking_token_hash text,
  add column invitation_token_hash text,
  add column invited_at timestamptz,
  add column invitation_expires_at timestamptz,
  add column invitation_revoked_at timestamptz,
  add column invitation_expired_at timestamptz,
  add column invitation_accepted_at timestamptz;

update public.registrations as registration
set price_halalas_at_booking = event.price_halalas
from public.events as event
where event.id = registration.event_id;

alter table public.registrations
  alter column price_halalas_at_booking set not null,
  add constraint registrations_participant_age_valid
    check (participant_age is null or participant_age between 6 and 17),
  add constraint registrations_guardian_name_length
    check (
      guardian_name is null
      or length(btrim(guardian_name)) between 2 and 120
    ),
  add constraint registrations_booking_price_non_negative
    check (price_halalas_at_booking >= 0),
  add constraint registrations_booking_token_hash_valid
    check (
      booking_token_hash is null
      or booking_token_hash ~ '^[0-9a-f]{64}$'
    ),
  add constraint registrations_invitation_token_hash_valid
    check (
      invitation_token_hash is null
      or invitation_token_hash ~ '^[0-9a-f]{64}$'
    ),
  add constraint registrations_invitation_state_valid
    check (
      status <> 'invited'
      or (
        invitation_token_hash is not null
        and invited_at is not null
        and invitation_expires_at is not null
        and invitation_expires_at > invited_at
      )
    );

alter table public.registrations
  drop constraint registrations_status_valid,
  add constraint registrations_status_valid
    check (status in ('registered', 'waitlisted', 'invited', 'cancelled'));

drop index public.registrations_event_phone_unique;
drop index public.registrations_event_email_unique;

create unique index registrations_event_adult_phone_unique
  on public.registrations (event_id, phone_e164)
  where participant_age is null;

create unique index registrations_event_minor_identity_unique
  on public.registrations (event_id, phone_e164, lower(attendee_name))
  where participant_age is not null;

create unique index registrations_event_adult_email_unique
  on public.registrations (event_id, lower(email))
  where email is not null and participant_age is null;

create unique index registrations_booking_token_hash_unique
  on public.registrations (booking_token_hash)
  where booking_token_hash is not null;

create unique index registrations_invitation_token_hash_unique
  on public.registrations (invitation_token_hash)
  where invitation_token_hash is not null;

create index registrations_active_event_idx
  on public.registrations (event_id, status, invitation_expires_at)
  where status in ('registered', 'invited');

create or replace function private.expire_waitlist_invitations(
  p_event_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  expired_count integer;
begin
  update public.registrations
  set
    status = 'waitlisted',
    invitation_token_hash = null,
    invitation_expires_at = null,
    invitation_expired_at = now()
  where status = 'invited'
    and invitation_expires_at <= now()
    and (p_event_id is null or event_id = p_event_id);

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

revoke all on function private.expire_waitlist_invitations(uuid)
  from public, anon, authenticated;

create or replace function private.enforce_event_capacity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  active_count integer;
begin
  if new.capacity >= old.capacity then
    return new;
  end if;

  select count(*)::integer
  into active_count
  from public.registrations
  where event_id = new.id
    and (
      status = 'registered'
      or (status = 'invited' and invitation_expires_at > now())
    );

  if new.capacity < active_count then
    raise sqlstate 'P0001' using message = 'capacity_below_active_reservations';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_event_capacity()
  from public, anon, authenticated;

create trigger events_enforce_capacity
before update of capacity on public.events
for each row
execute function private.enforce_event_capacity();

drop function public.register_for_event(uuid, text, text, text, boolean);

create function public.register_for_event(
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

  if selected_event.audience = 'children' then
    if p_participant_age is null
      or p_participant_age not between 6 and 12
      or normalized_guardian_name is null
      or length(normalized_guardian_name) not between 2 and 120
      or p_guardian_consent is not true
    then
      raise sqlstate 'P0001' using message = 'minor_registration_invalid';
    end if;
  elsif selected_event.audience = 'youth' then
    if p_participant_age is null
      or p_participant_age not between 13 and 17
      or normalized_guardian_name is null
      or length(normalized_guardian_name) not between 2 and 120
      or p_guardian_consent is not true
    then
      raise sqlstate 'P0001' using message = 'minor_registration_invalid';
    end if;
  elsif p_participant_age is not null
    or normalized_guardian_name is not null
    or p_guardian_consent is true
  then
    raise sqlstate 'P0001' using message = 'invalid_registration';
  end if;

  if exists (
    select 1
    from public.registrations
    where event_id = p_event_id
      and (
        (
          selected_event.audience = 'adults'
          and participant_age is null
          and (
            phone_e164 = p_phone_e164
            or (normalized_email is not null and lower(email) = normalized_email)
          )
        )
        or (
          selected_event.audience <> 'adults'
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
    case when selected_event.audience = 'adults' then null else p_participant_age end,
    case when selected_event.audience = 'adults' then null else normalized_guardian_name end,
    case when selected_event.audience = 'adults' then false else true end,
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

revoke all on function public.register_for_event(
  uuid, text, text, text, text, integer, boolean, text
) from public, anon, authenticated;
grant execute on function public.register_for_event(
  uuid, text, text, text, text, integer, boolean, text
) to anon, authenticated;

drop function public.promote_waitlisted_registration(uuid);

create function public.invite_waitlisted_registration(
  p_registration_id uuid,
  p_invitation_token_hash text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_event_id uuid;
  selected_registration public.registrations%rowtype;
  selected_event public.events%rowtype;
  active_count integer;
  expires_at timestamptz := now() + interval '6 hours';
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  if p_invitation_token_hash !~ '^[0-9a-f]{64}$' then
    raise sqlstate 'P0001' using message = 'invalid_invitation_token';
  end if;

  select event_id
  into selected_event_id
  from public.registrations
  where id = p_registration_id;

  if not found then
    raise sqlstate 'P0001' using message = 'registration_not_found';
  end if;

  select *
  into selected_event
  from public.events
  where id = selected_event_id
  for update;

  perform private.expire_waitlist_invitations(selected_event_id);

  select *
  into selected_registration
  from public.registrations
  where id = p_registration_id
  for update;

  if selected_registration.status <> 'waitlisted' then
    raise sqlstate 'P0001' using message = 'registration_not_waitlisted';
  end if;

  if selected_event.starts_at <= now()
    or selected_event.publication_status <> 'published'
  then
    raise sqlstate 'P0001' using message = 'event_unavailable';
  end if;

  select count(*)::integer
  into active_count
  from public.registrations
  where event_id = selected_event_id
    and (
      status = 'registered'
      or (status = 'invited' and invitation_expires_at > now())
    );

  if active_count >= selected_event.capacity then
    raise sqlstate 'P0001' using message = 'event_capacity_reached';
  end if;

  update public.registrations
  set
    status = 'invited',
    invitation_token_hash = p_invitation_token_hash,
    invited_at = now(),
    invitation_expires_at = expires_at,
    invitation_revoked_at = null,
    invitation_expired_at = null,
    invitation_accepted_at = null
  where id = p_registration_id;

  return expires_at;
exception
  when unique_violation then
    raise sqlstate 'P0001' using message = 'invitation_token_collision';
end;
$$;

revoke all on function public.invite_waitlisted_registration(uuid, text)
  from public, anon, authenticated;
grant execute on function public.invite_waitlisted_registration(uuid, text)
  to authenticated;

create function public.revoke_waitlist_invitation(p_registration_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_event_id uuid;
  selected_status text;
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  select event_id
  into selected_event_id
  from public.registrations
  where id = p_registration_id;

  if not found then
    raise sqlstate 'P0001' using message = 'registration_not_found';
  end if;

  perform 1
  from public.events
  where id = selected_event_id
  for update;

  select status
  into selected_status
  from public.registrations
  where id = p_registration_id
  for update;

  if selected_status <> 'invited' then
    raise sqlstate 'P0001' using message = 'registration_not_invited';
  end if;

  update public.registrations
  set
    status = 'waitlisted',
    invitation_token_hash = null,
    invitation_expires_at = null,
    invitation_revoked_at = now()
  where id = p_registration_id;
end;
$$;

revoke all on function public.revoke_waitlist_invitation(uuid)
  from public, anon, authenticated;
grant execute on function public.revoke_waitlist_invitation(uuid)
  to authenticated;

create function public.get_waitlist_invitation(p_invitation_token_hash text)
returns table (
  attendee_name text,
  event_title text,
  event_starts_at timestamptz,
  invitation_expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    registration.attendee_name,
    event.title,
    event.starts_at,
    registration.invitation_expires_at
  from public.registrations as registration
  join public.events as event on event.id = registration.event_id
  where registration.invitation_token_hash = p_invitation_token_hash
    and registration.status = 'invited'
    and registration.invitation_expires_at > now()
    and event.starts_at > now();
$$;

revoke all on function public.get_waitlist_invitation(text)
  from public, anon, authenticated;
grant execute on function public.get_waitlist_invitation(text)
  to anon, authenticated;

create function public.accept_waitlist_invitation(p_invitation_token_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_registration_id uuid;
  selected_event_id uuid;
  selected_registration public.registrations%rowtype;
  selected_event public.events%rowtype;
  registered_count integer;
begin
  select id, event_id
  into selected_registration_id, selected_event_id
  from public.registrations
  where invitation_token_hash = p_invitation_token_hash;

  if not found then
    raise sqlstate 'P0001' using message = 'invitation_unavailable';
  end if;

  select *
  into selected_event
  from public.events
  where id = selected_event_id
  for update;

  select *
  into selected_registration
  from public.registrations
  where id = selected_registration_id
  for update;

  if selected_registration.status <> 'invited'
    or selected_registration.invitation_expires_at <= now()
    or selected_event.starts_at <= now()
  then
    raise sqlstate 'P0001' using message = 'invitation_unavailable';
  end if;

  select count(*)::integer
  into registered_count
  from public.registrations
  where event_id = selected_event_id
    and status = 'registered';

  if registered_count >= selected_event.capacity then
    raise sqlstate 'P0001' using message = 'event_capacity_reached';
  end if;

  update public.registrations
  set
    status = 'registered',
    promoted_at = now(),
    invitation_token_hash = null,
    invitation_expires_at = null,
    invitation_accepted_at = now()
  where id = selected_registration_id;
end;
$$;

revoke all on function public.accept_waitlist_invitation(text)
  from public, anon, authenticated;
grant execute on function public.accept_waitlist_invitation(text)
  to anon, authenticated;

create function public.get_booking_by_token(p_booking_token_hash text)
returns table (
  attendee_name text,
  event_title text,
  event_starts_at timestamptz,
  event_ends_at timestamptz,
  registration_status text,
  attendance_status text,
  price_halalas_at_booking integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    registration.attendee_name,
    event.title,
    event.starts_at,
    event.ends_at,
    registration.status,
    registration.attendance_status,
    registration.price_halalas_at_booking
  from public.registrations as registration
  join public.events as event on event.id = registration.event_id
  where registration.booking_token_hash = p_booking_token_hash
    and registration.status <> 'cancelled'
    and coalesce(event.ends_at, event.starts_at) > now();
$$;

revoke all on function public.get_booking_by_token(text)
  from public, anon, authenticated;
grant execute on function public.get_booking_by_token(text)
  to anon, authenticated;

create function public.cancel_booking_by_token(p_booking_token_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_registration_id uuid;
  selected_event_id uuid;
  selected_status text;
  event_ends_at timestamptz;
begin
  select registration.id, registration.event_id
  into selected_registration_id, selected_event_id
  from public.registrations as registration
  where registration.booking_token_hash = p_booking_token_hash;

  if not found then
    raise sqlstate 'P0001' using message = 'booking_unavailable';
  end if;

  select coalesce(ends_at, starts_at)
  into event_ends_at
  from public.events
  where id = selected_event_id
  for update;

  select status
  into selected_status
  from public.registrations
  where id = selected_registration_id
  for update;

  if selected_status = 'cancelled' or event_ends_at <= now() then
    raise sqlstate 'P0001' using message = 'booking_unavailable';
  end if;

  update public.registrations
  set
    status = 'cancelled',
    cancelled_at = now(),
    booking_token_hash = null,
    invitation_token_hash = null,
    invitation_expires_at = null
  where id = selected_registration_id;
end;
$$;

revoke all on function public.cancel_booking_by_token(text)
  from public, anon, authenticated;
grant execute on function public.cancel_booking_by_token(text)
  to anon, authenticated;

create function public.confirm_booking_attendance_by_token(p_booking_token_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.registrations as registration
  set attendance_status = 'confirmed'
  from public.events as event
  where registration.booking_token_hash = p_booking_token_hash
    and registration.event_id = event.id
    and registration.status = 'registered'
    and coalesce(event.ends_at, event.starts_at) > now();

  if not found then
    raise sqlstate 'P0001' using message = 'booking_unavailable';
  end if;
end;
$$;

revoke all on function public.confirm_booking_attendance_by_token(text)
  from public, anon, authenticated;
grant execute on function public.confirm_booking_attendance_by_token(text)
  to anon, authenticated;

create function public.get_event_registration_states()
returns table (
  event_id uuid,
  active_reservation_count bigint,
  registration_availability text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    event.id,
    count(registration.id) filter (
      where registration.status = 'registered'
        or (
          registration.status = 'invited'
          and registration.invitation_expires_at > now()
        )
    ) as active_reservation_count,
    case
      when event.registration_status = 'closed' or event.starts_at <= now()
        then 'closed'
      when count(registration.id) filter (
        where registration.status = 'registered'
          or (
            registration.status = 'invited'
            and registration.invitation_expires_at > now()
          )
      ) >= event.capacity
        then 'full'
      else 'available'
    end as registration_availability
  from public.events as event
  left join public.registrations as registration
    on registration.event_id = event.id
  where (
    event.publication_status = 'published'
    and event.starts_at >= now()
  ) or (select private.is_admin())
  group by event.id;
$$;

revoke all on function public.get_event_registration_states()
  from public, anon, authenticated;
grant execute on function public.get_event_registration_states()
  to anon, authenticated;

create or replace function public.cancel_registration(p_registration_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  update public.registrations
  set
    status = 'cancelled',
    cancelled_at = now(),
    booking_token_hash = null,
    invitation_token_hash = null,
    invitation_expires_at = null
  where id = p_registration_id
    and status <> 'cancelled';

  if not found then
    raise sqlstate 'P0001' using message = 'registration_not_found';
  end if;
end;
$$;

revoke all on function public.cancel_registration(uuid)
  from public, anon, authenticated;
grant execute on function public.cancel_registration(uuid)
  to authenticated;

alter table public.events drop column availability;

select cron.schedule(
  'expire-waitlist-invitations',
  '*/15 * * * *',
  $$select private.expire_waitlist_invitations()$$
);
