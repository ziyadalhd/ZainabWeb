alter table public.events
  drop constraint if exists events_publication_status_valid;

alter table public.events
  add constraint events_publication_status_valid
  check (publication_status in ('draft', 'published', 'archived', 'cancelled'));

comment on constraint events_publication_status_valid on public.events is
  'Forward repair: retained cancelled events are valid and remain unavailable for new registration.';

create table public.manual_messages (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  message_kind text not null
    constraint manual_messages_kind_valid
    check (message_kind in (
      'confirmation',
      'reminder_24h',
      'reminder_3h',
      'waitlist_invitation',
      'cancellation',
      'feedback_request'
    )),
  secure_token_hash text
    constraint manual_messages_token_hash_valid
    check (secure_token_hash is null or secure_token_hash ~ '^[0-9a-f]{64}$'),
  prepared_at timestamptz not null default now(),
  sent_at timestamptz,
  superseded_at timestamptz,
  constraint manual_messages_token_required
    check (
      (message_kind = 'cancellation' and secure_token_hash is null)
      or (message_kind <> 'cancellation' and secure_token_hash is not null)
    ),
  constraint manual_messages_lifecycle_valid
    check (
      (sent_at is null or sent_at >= prepared_at)
      and (superseded_at is null or superseded_at >= prepared_at)
      and not (sent_at is not null and superseded_at is not null)
    )
);

comment on table public.manual_messages is
  'Administrator-prepared manual event messages. Stores only message kind, a secure token hash when required, and operational timestamps; plaintext tokens, message bodies, names, and phone numbers are never persisted.';
comment on column public.manual_messages.sent_at is
  'Administrator-declared manual send time. Opening WhatsApp is not considered sent or delivered.';
comment on column public.manual_messages.superseded_at is
  'Time an unused prepared message was replaced. Superseded secure links are invalid.';

create unique index manual_messages_secure_token_hash_idx
  on public.manual_messages (secure_token_hash)
  where secure_token_hash is not null;
create unique index manual_messages_one_current_draft_idx
  on public.manual_messages (registration_id, message_kind)
  where sent_at is null and superseded_at is null;
create index manual_messages_registration_prepared_idx
  on public.manual_messages (registration_id, prepared_at desc);

alter table public.manual_messages enable row level security;

revoke all on table public.manual_messages from public, anon, authenticated;
grant select on table public.manual_messages to authenticated;

create policy manual_messages_admin_select
on public.manual_messages
for select
to authenticated
using ((select private.is_admin()));

create function private.prepare_manual_registration_message(
  p_registration_id uuid,
  p_message_kind text,
  p_secure_token_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_registration public.registrations%rowtype;
  selected_event public.events%rowtype;
  prepared_message_id uuid;
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  if p_message_kind not in (
    'confirmation',
    'reminder_24h',
    'reminder_3h',
    'waitlist_invitation',
    'cancellation',
    'feedback_request'
  ) then
    raise sqlstate 'P0001' using message = 'invalid_message_kind';
  end if;

  if (
    p_message_kind = 'cancellation'
    and p_secure_token_hash is not null
  ) or (
    p_message_kind <> 'cancellation'
    and coalesce(p_secure_token_hash, '') !~ '^[0-9a-f]{64}$'
  ) then
    raise sqlstate 'P0001' using message = 'invalid_message_token';
  end if;

  select *
  into selected_registration
  from public.registrations
  where id = p_registration_id
  for update;

  if not found then
    raise sqlstate 'P0001' using message = 'registration_not_found';
  end if;

  select *
  into selected_event
  from public.events
  where id = selected_registration.event_id;

  if p_message_kind in ('confirmation', 'reminder_24h', 'reminder_3h')
    and (
      selected_registration.status <> 'registered'
      or coalesce(selected_event.ends_at, selected_event.starts_at) <= now()
    )
  then
    raise sqlstate 'P0001' using message = 'registration_not_active';
  end if;

  if p_message_kind = 'waitlist_invitation'
    and (
      selected_registration.status <> 'invited'
      or selected_registration.invitation_expires_at <= now()
    )
  then
    raise sqlstate 'P0001' using message = 'invitation_unavailable';
  end if;

  if p_message_kind = 'cancellation'
    and (
      selected_registration.status <> 'registered'
      or selected_event.publication_status <> 'cancelled'
    )
  then
    raise sqlstate 'P0001' using message = 'cancellation_notice_unavailable';
  end if;

  if p_message_kind = 'feedback_request'
    and (
      selected_registration.status <> 'registered'
      or coalesce(selected_event.ends_at, selected_event.starts_at) > now()
    )
  then
    raise sqlstate 'P0001' using message = 'feedback_request_unavailable';
  end if;

  update public.manual_messages
  set superseded_at = now()
  where registration_id = p_registration_id
    and message_kind = p_message_kind
    and sent_at is null
    and superseded_at is null;

  insert into public.manual_messages (
    registration_id,
    message_kind,
    secure_token_hash
  ) values (
    p_registration_id,
    p_message_kind,
    p_secure_token_hash
  )
  returning id into prepared_message_id;

  return prepared_message_id;
exception
  when unique_violation then
    raise sqlstate 'P0001' using message = 'manual_message_conflict';
end;
$$;

revoke all on function private.prepare_manual_registration_message(uuid, text, text)
  from public, anon, authenticated;
grant execute on function private.prepare_manual_registration_message(uuid, text, text)
  to authenticated;

create function public.prepare_manual_registration_message(
  p_registration_id uuid,
  p_message_kind text,
  p_secure_token_hash text default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.prepare_manual_registration_message(
    p_registration_id,
    p_message_kind,
    p_secure_token_hash
  );
$$;

revoke all on function public.prepare_manual_registration_message(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.prepare_manual_registration_message(uuid, text, text)
  to authenticated;

create function private.mark_manual_message_sent(p_message_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_message public.manual_messages%rowtype;
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  update public.manual_messages
  set sent_at = coalesce(sent_at, now())
  where id = p_message_id
    and superseded_at is null
  returning * into selected_message;

  if not found then
    raise sqlstate 'P0001' using message = 'manual_message_not_found';
  end if;

  if selected_message.message_kind = 'confirmation' then
    update public.registrations
    set confirmation_sent_at = coalesce(confirmation_sent_at, selected_message.sent_at)
    where id = selected_message.registration_id;
  end if;

  return selected_message.sent_at;
end;
$$;

revoke all on function private.mark_manual_message_sent(uuid)
  from public, anon, authenticated;
grant execute on function private.mark_manual_message_sent(uuid)
  to authenticated;

create function public.mark_manual_message_sent(p_message_id uuid)
returns timestamptz
language sql
security invoker
set search_path = ''
as $$
  select private.mark_manual_message_sent(p_message_id);
$$;

revoke all on function public.mark_manual_message_sent(uuid)
  from public, anon, authenticated;
grant execute on function public.mark_manual_message_sent(uuid)
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
      or exists (
        select 1
        from public.manual_messages as message
        where message.registration_id = registration.id
          and message.message_kind in ('confirmation', 'reminder_24h', 'reminder_3h')
          and message.secure_token_hash = p_booking_token_hash
          and message.superseded_at is null
      )
    )
    and registration.status <> 'cancelled'
    and event.publication_status <> 'cancelled'
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
  join public.events as event on event.id = registration.event_id
  where event.publication_status <> 'cancelled'
    and (
      registration.booking_token_hash = p_booking_token_hash
      or exists (
      select 1
      from public.registration_reminders as reminder
      where reminder.registration_id = registration.id
        and reminder.management_token_hash = p_booking_token_hash
      )
      or exists (
      select 1
      from public.manual_messages as message
      where message.registration_id = registration.id
        and message.message_kind in ('confirmation', 'reminder_24h', 'reminder_3h')
        and message.secure_token_hash = p_booking_token_hash
        and message.superseded_at is null
      )
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
      or exists (
        select 1
        from public.manual_messages as message
        where message.registration_id = registration.id
          and message.message_kind in ('confirmation', 'reminder_24h', 'reminder_3h')
          and message.secure_token_hash = p_booking_token_hash
          and message.superseded_at is null
      )
    )
    and registration.event_id = event.id
    and registration.status = 'registered'
    and event.publication_status <> 'cancelled'
    and coalesce(event.ends_at, event.starts_at) > now();

  if not found then
    raise sqlstate 'P0001' using message = 'booking_unavailable';
  end if;
end;
$$;

create or replace function private.invalidate_registration_reminders_on_cancellation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.registration_reminders
  where registration_id = new.id;

  update public.manual_messages
  set superseded_at = now()
  where registration_id = new.id
    and sent_at is null
    and superseded_at is null;

  return new;
end;
$$;

comment on function public.prepare_manual_registration_message(uuid, text, text) is
  'Prepares one administrator-only manual message and supersedes any unused draft for the same registration and category.';
comment on function public.mark_manual_message_sent(uuid) is
  'Idempotently records the administrator declaration that a manual message was sent; it does not claim delivery.';
