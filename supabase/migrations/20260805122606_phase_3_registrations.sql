create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  public_reference uuid not null default gen_random_uuid() unique,
  event_id uuid not null references public.events (id) on delete restrict,
  attendee_name text not null
    constraint registrations_attendee_name_length
    check (length(btrim(attendee_name)) between 2 and 120),
  phone_e164 text not null
    constraint registrations_saudi_mobile_valid
    check (phone_e164 ~ '^\+9665[0-9]{8}$'),
  email text
    constraint registrations_email_valid
    check (
      email is null
      or (
        length(email) <= 254
        and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      )
    ),
  guardian_consent boolean not null default false,
  status text not null
    constraint registrations_status_valid
    check (status in ('registered', 'waitlisted', 'cancelled')),
  attendance_status text not null default 'pending'
    constraint registrations_attendance_status_valid
    check (attendance_status in ('pending', 'confirmed')),
  retention_until timestamptz not null,
  promoted_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.registrations is
  'Guest event registrations. Contains personal data and is readable only by approved administrators.';
comment on column public.registrations.phone_e164 is
  'Required Saudi mobile number normalized to E.164 for manual WhatsApp communication.';
comment on column public.registrations.retention_until is
  'Personal-data deletion deadline: 90 days after the event end, or start when the end is transitional.';

create unique index registrations_event_phone_unique
  on public.registrations (event_id, phone_e164);

create unique index registrations_event_email_unique
  on public.registrations (event_id, lower(email))
  where email is not null;

create index registrations_event_status_created_idx
  on public.registrations (event_id, status, created_at);

create index registrations_retention_until_idx
  on public.registrations (retention_until);

alter table public.registrations enable row level security;

revoke all on table public.registrations from public, anon, authenticated;
grant select on table public.registrations to authenticated;

create policy registrations_admin_select
on public.registrations
for select
to authenticated
using ((select private.is_admin()));

create trigger registrations_set_updated_at
before update on public.registrations
for each row
execute function private.set_updated_at();

create or replace function public.register_for_event(
  p_event_id uuid,
  p_attendee_name text,
  p_phone_e164 text,
  p_email text,
  p_guardian_consent boolean
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
  active_count integer;
  selected_status text;
begin
  if length(normalized_name) not between 2 and 120
    or p_phone_e164 !~ '^\+9665[0-9]{8}$'
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
    or selected_event.starts_at < now()
    or selected_event.ends_at is null
    or selected_event.price_halalas is null
  then
    raise sqlstate 'P0001' using message = 'event_unavailable';
  end if;

  if selected_event.audience = 'children' and p_guardian_consent is not true then
    raise sqlstate 'P0001' using message = 'guardian_consent_required';
  end if;

  if exists (
    select 1
    from public.registrations
    where event_id = p_event_id
      and (
        phone_e164 = p_phone_e164
        or (normalized_email is not null and lower(email) = normalized_email)
      )
  ) then
    raise sqlstate 'P0001' using message = 'duplicate_registration';
  end if;

  select count(*)::integer
  into active_count
  from public.registrations
  where event_id = p_event_id
    and status = 'registered';

  selected_status := case
    when selected_event.availability = 'available'
      and active_count < selected_event.capacity
    then 'registered'
    else 'waitlisted'
  end;

  return query
  insert into public.registrations (
    event_id,
    attendee_name,
    phone_e164,
    email,
    guardian_consent,
    status,
    retention_until
  )
  values (
    p_event_id,
    normalized_name,
    p_phone_e164,
    normalized_email,
    case when selected_event.audience = 'children' then p_guardian_consent else false end,
    selected_status,
    coalesce(selected_event.ends_at, selected_event.starts_at) + interval '90 days'
  )
  returning public_reference, status;
exception
  when unique_violation then
    raise sqlstate 'P0001' using message = 'duplicate_registration';
end;
$$;

revoke all on function public.register_for_event(uuid, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.register_for_event(uuid, text, text, text, boolean)
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
  set status = 'cancelled', cancelled_at = now()
  where id = p_registration_id
    and status <> 'cancelled';

  if not found then
    raise sqlstate 'P0001' using message = 'registration_not_found';
  end if;
end;
$$;

revoke all on function public.cancel_registration(uuid) from public, anon, authenticated;
grant execute on function public.cancel_registration(uuid) to authenticated;

create or replace function public.promote_waitlisted_registration(p_registration_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_registration public.registrations%rowtype;
  selected_event public.events%rowtype;
  active_count integer;
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  select *
  into selected_registration
  from public.registrations
  where id = p_registration_id
  for update;

  if not found or selected_registration.status <> 'waitlisted' then
    raise sqlstate 'P0001' using message = 'registration_not_waitlisted';
  end if;

  select *
  into selected_event
  from public.events
  where id = selected_registration.event_id
  for update;

  select count(*)::integer
  into active_count
  from public.registrations
  where event_id = selected_registration.event_id
    and status = 'registered';

  if active_count >= selected_event.capacity then
    raise sqlstate 'P0001' using message = 'event_capacity_reached';
  end if;

  update public.registrations
  set status = 'registered', promoted_at = now()
  where id = p_registration_id;
end;
$$;

revoke all on function public.promote_waitlisted_registration(uuid)
  from public, anon, authenticated;
grant execute on function public.promote_waitlisted_registration(uuid)
  to authenticated;

create or replace function public.confirm_registration_attendance(p_registration_id uuid)
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
  set attendance_status = 'confirmed'
  where id = p_registration_id
    and status = 'registered';

  if not found then
    raise sqlstate 'P0001' using message = 'registration_not_active';
  end if;
end;
$$;

revoke all on function public.confirm_registration_attendance(uuid)
  from public, anon, authenticated;
grant execute on function public.confirm_registration_attendance(uuid)
  to authenticated;

create or replace function private.sync_registration_retention()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.starts_at is distinct from old.starts_at
    or new.ends_at is distinct from old.ends_at
  then
    update public.registrations
    set retention_until = coalesce(new.ends_at, new.starts_at) + interval '90 days'
    where event_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function private.sync_registration_retention()
  from public, anon, authenticated;

create trigger events_sync_registration_retention
after update of starts_at, ends_at on public.events
for each row
execute function private.sync_registration_retention();

create or replace function private.delete_expired_registration_data()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from public.registrations
  where retention_until < now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function private.delete_expired_registration_data()
  from public, anon, authenticated;

create extension if not exists pg_cron;

select cron.schedule(
  'delete-expired-event-registration-data',
  '30 0 * * *',
  $$select private.delete_expired_registration_data()$$
);
