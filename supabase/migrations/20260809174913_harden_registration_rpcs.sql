alter function public.register_for_event(
  uuid, text, text, text, text, integer, boolean, text
) set schema private;
alter function public.invite_waitlisted_registration(uuid, text) set schema private;
alter function public.revoke_waitlist_invitation(uuid) set schema private;
alter function public.get_waitlist_invitation(text) set schema private;
alter function public.accept_waitlist_invitation(text) set schema private;
alter function public.get_booking_by_token(text) set schema private;
alter function public.cancel_booking_by_token(text) set schema private;
alter function public.confirm_booking_attendance_by_token(text) set schema private;
alter function public.get_event_registration_states() set schema private;
alter function public.cancel_registration(uuid) set schema private;
alter function public.confirm_registration_attendance(uuid) set schema private;

revoke all on function private.register_for_event(
  uuid, text, text, text, text, integer, boolean, text
) from public, anon, authenticated;
revoke all on function private.invite_waitlisted_registration(uuid, text)
  from public, anon, authenticated;
revoke all on function private.revoke_waitlist_invitation(uuid)
  from public, anon, authenticated;
revoke all on function private.get_waitlist_invitation(text)
  from public, anon, authenticated;
revoke all on function private.accept_waitlist_invitation(text)
  from public, anon, authenticated;
revoke all on function private.get_booking_by_token(text)
  from public, anon, authenticated;
revoke all on function private.cancel_booking_by_token(text)
  from public, anon, authenticated;
revoke all on function private.confirm_booking_attendance_by_token(text)
  from public, anon, authenticated;
revoke all on function private.get_event_registration_states()
  from public, anon, authenticated;
revoke all on function private.cancel_registration(uuid)
  from public, anon, authenticated;
revoke all on function private.confirm_registration_attendance(uuid)
  from public, anon, authenticated;

grant usage on schema private to anon, authenticated;

grant execute on function private.register_for_event(
  uuid, text, text, text, text, integer, boolean, text
) to anon, authenticated;
grant execute on function private.get_waitlist_invitation(text)
  to anon, authenticated;
grant execute on function private.accept_waitlist_invitation(text)
  to anon, authenticated;
grant execute on function private.get_booking_by_token(text)
  to anon, authenticated;
grant execute on function private.cancel_booking_by_token(text)
  to anon, authenticated;
grant execute on function private.confirm_booking_attendance_by_token(text)
  to anon, authenticated;
grant execute on function private.get_event_registration_states()
  to anon, authenticated;
grant execute on function private.invite_waitlisted_registration(uuid, text)
  to authenticated;
grant execute on function private.revoke_waitlist_invitation(uuid)
  to authenticated;
grant execute on function private.cancel_registration(uuid)
  to authenticated;
grant execute on function private.confirm_registration_attendance(uuid)
  to authenticated;

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
language sql
security invoker
set search_path = ''
as $$
  select * from private.register_for_event(
    p_event_id,
    p_attendee_name,
    p_phone_e164,
    p_email,
    p_guardian_name,
    p_participant_age,
    p_guardian_consent,
    p_booking_token_hash
  );
$$;

create function public.invite_waitlisted_registration(
  p_registration_id uuid,
  p_invitation_token_hash text
)
returns timestamptz
language sql
security invoker
set search_path = ''
as $$
  select private.invite_waitlisted_registration(
    p_registration_id,
    p_invitation_token_hash
  );
$$;

create function public.revoke_waitlist_invitation(p_registration_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.revoke_waitlist_invitation(p_registration_id);
$$;

create function public.get_waitlist_invitation(p_invitation_token_hash text)
returns table (
  attendee_name text,
  event_title text,
  event_starts_at timestamptz,
  invitation_expires_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_waitlist_invitation(p_invitation_token_hash);
$$;

create function public.accept_waitlist_invitation(p_invitation_token_hash text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.accept_waitlist_invitation(p_invitation_token_hash);
$$;

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
security invoker
set search_path = ''
as $$
  select * from private.get_booking_by_token(p_booking_token_hash);
$$;

create function public.cancel_booking_by_token(p_booking_token_hash text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.cancel_booking_by_token(p_booking_token_hash);
$$;

create function public.confirm_booking_attendance_by_token(p_booking_token_hash text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.confirm_booking_attendance_by_token(p_booking_token_hash);
$$;

create function public.get_event_registration_states()
returns table (
  event_id uuid,
  active_reservation_count bigint,
  registration_availability text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_event_registration_states();
$$;

create function public.cancel_registration(p_registration_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.cancel_registration(p_registration_id);
$$;

create function public.confirm_registration_attendance(p_registration_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.confirm_registration_attendance(p_registration_id);
$$;

revoke all on function public.register_for_event(
  uuid, text, text, text, text, integer, boolean, text
) from public, anon, authenticated;
revoke all on function public.invite_waitlisted_registration(uuid, text)
  from public, anon, authenticated;
revoke all on function public.revoke_waitlist_invitation(uuid)
  from public, anon, authenticated;
revoke all on function public.get_waitlist_invitation(text)
  from public, anon, authenticated;
revoke all on function public.accept_waitlist_invitation(text)
  from public, anon, authenticated;
revoke all on function public.get_booking_by_token(text)
  from public, anon, authenticated;
revoke all on function public.cancel_booking_by_token(text)
  from public, anon, authenticated;
revoke all on function public.confirm_booking_attendance_by_token(text)
  from public, anon, authenticated;
revoke all on function public.get_event_registration_states()
  from public, anon, authenticated;
revoke all on function public.cancel_registration(uuid)
  from public, anon, authenticated;
revoke all on function public.confirm_registration_attendance(uuid)
  from public, anon, authenticated;

grant execute on function public.register_for_event(
  uuid, text, text, text, text, integer, boolean, text
) to anon, authenticated;
grant execute on function public.get_waitlist_invitation(text)
  to anon, authenticated;
grant execute on function public.accept_waitlist_invitation(text)
  to anon, authenticated;
grant execute on function public.get_booking_by_token(text)
  to anon, authenticated;
grant execute on function public.cancel_booking_by_token(text)
  to anon, authenticated;
grant execute on function public.confirm_booking_attendance_by_token(text)
  to anon, authenticated;
grant execute on function public.get_event_registration_states()
  to anon, authenticated;
grant execute on function public.invite_waitlisted_registration(uuid, text)
  to authenticated;
grant execute on function public.revoke_waitlist_invitation(uuid)
  to authenticated;
grant execute on function public.cancel_registration(uuid)
  to authenticated;
grant execute on function public.confirm_registration_attendance(uuid)
  to authenticated;

comment on function public.register_for_event(
  uuid, text, text, text, text, integer, boolean, text
) is 'Invoker wrapper for anonymous event registration. Privileged implementation is isolated in the private schema.';
comment on function public.get_booking_by_token(text) is
  'Invoker wrapper authorized by a 256-bit booking token hash. Returns one active booking and exposes no list access.';
comment on function public.get_waitlist_invitation(text) is
  'Invoker wrapper authorized by a 256-bit invitation token hash. Returns one unexpired invitation.';
comment on function public.get_event_registration_states() is
  'Invoker wrapper exposing aggregate seat counts and derived availability without registration personal data.';
