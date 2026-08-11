create table public.registration_reminders (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  management_token_hash text not null unique
    constraint registration_reminders_token_hash_valid
    check (management_token_hash ~ '^[0-9a-f]{64}$'),
  prepared_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint registration_reminders_sent_after_prepared
    check (sent_at is null or sent_at >= prepared_at)
);

comment on table public.registration_reminders is
  'Administrator-prepared manual attendance reminders. Stores only a secure management-token hash and delivery metadata; message text and plaintext tokens are never persisted.';
comment on column public.registration_reminders.sent_at is
  'Administrator-declared manual send time. A prepared WhatsApp link is not considered sent until this is explicitly set.';

create index registration_reminders_registration_prepared_idx
  on public.registration_reminders (registration_id, prepared_at desc);

alter table public.registration_reminders enable row level security;

revoke all on table public.registration_reminders from public, anon, authenticated;
grant select on table public.registration_reminders to authenticated;

create policy registration_reminders_admin_select
on public.registration_reminders
for select
to authenticated
using ((select private.is_admin()));

create function private.issue_registration_reminder(
  p_registration_id uuid,
  p_management_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  reminder_id uuid;
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  if p_management_token_hash !~ '^[0-9a-f]{64}$' then
    raise sqlstate 'P0001' using message = 'invalid_reminder_token';
  end if;

  if not exists (
    select 1
    from public.registrations as registration
    join public.events as event on event.id = registration.event_id
    where registration.id = p_registration_id
      and registration.status = 'registered'
      and coalesce(event.ends_at, event.starts_at) > now()
  ) then
    raise sqlstate 'P0001' using message = 'registration_not_active';
  end if;

  insert into public.registration_reminders (
    registration_id,
    management_token_hash
  )
  values (
    p_registration_id,
    p_management_token_hash
  )
  returning id into reminder_id;

  return reminder_id;
end;
$$;

revoke all on function private.issue_registration_reminder(uuid, text)
  from public, anon, authenticated;
grant execute on function private.issue_registration_reminder(uuid, text)
  to authenticated;

create function public.issue_registration_reminder(
  p_registration_id uuid,
  p_management_token_hash text
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.issue_registration_reminder(
    p_registration_id,
    p_management_token_hash
  );
$$;

revoke all on function public.issue_registration_reminder(uuid, text)
  from public, anon, authenticated;
grant execute on function public.issue_registration_reminder(uuid, text)
  to authenticated;

create function private.mark_registration_reminder_sent(p_reminder_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  update public.registration_reminders
  set sent_at = coalesce(sent_at, now())
  where id = p_reminder_id;

  if not found then
    raise sqlstate 'P0001' using message = 'reminder_not_found';
  end if;
end;
$$;

revoke all on function private.mark_registration_reminder_sent(uuid)
  from public, anon, authenticated;
grant execute on function private.mark_registration_reminder_sent(uuid)
  to authenticated;

create function public.mark_registration_reminder_sent(p_reminder_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.mark_registration_reminder_sent(p_reminder_id);
$$;

revoke all on function public.mark_registration_reminder_sent(uuid)
  from public, anon, authenticated;
grant execute on function public.mark_registration_reminder_sent(uuid)
  to authenticated;

create or replace function private.get_booking_by_token(p_booking_token_hash text)
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
  where (
      registration.booking_token_hash = p_booking_token_hash
      or exists (
        select 1
        from public.registration_reminders as reminder
        where reminder.registration_id = registration.id
          and reminder.management_token_hash = p_booking_token_hash
      )
    )
    and registration.status <> 'cancelled'
    and coalesce(event.ends_at, event.starts_at) > now();
$$;

create or replace function private.cancel_booking_by_token(p_booking_token_hash text)
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
  where registration.booking_token_hash = p_booking_token_hash
    or exists (
      select 1
      from public.registration_reminders as reminder
      where reminder.registration_id = registration.id
        and reminder.management_token_hash = p_booking_token_hash
    );

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

  delete from public.registration_reminders
  where registration_id = selected_registration_id;
end;
$$;

create or replace function private.confirm_booking_attendance_by_token(
  p_booking_token_hash text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.registrations as registration
  set attendance_status = 'confirmed'
  from public.events as event
  where (
      registration.booking_token_hash = p_booking_token_hash
      or exists (
        select 1
        from public.registration_reminders as reminder
        where reminder.registration_id = registration.id
          and reminder.management_token_hash = p_booking_token_hash
      )
    )
    and registration.event_id = event.id
    and registration.status = 'registered'
    and coalesce(event.ends_at, event.starts_at) > now();

  if not found then
    raise sqlstate 'P0001' using message = 'booking_unavailable';
  end if;
end;
$$;

comment on function public.issue_registration_reminder(uuid, text) is
  'Creates an administrator-only manual reminder with a separately hashed booking-management token.';
comment on function public.mark_registration_reminder_sent(uuid) is
  'Records an explicit administrator declaration that a prepared manual reminder was sent.';
