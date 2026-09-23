-- Brings production back in line with this repository. Comparing schema fingerprints between
-- production and the dev project found three kinds of drift (docs/payment-readiness-plan.md, F14):
--
-- 1. 20260810094942_service_requests wrote its phone and email patterns with doubled backslashes
--    ('\\+', '\\.'). With standard_conforming_strings on, those match a literal backslash, so the
--    phone check rejected every real number and the email check rejects every real address.
--    Production kept the broken email check (every request that included an email failed), lost
--    the phone check, and holds a hand-edited submit_service_request. The dev project applied
--    the file through a tool that unescaped it, so dev has the intended definitions.
-- 2. 20260830090000_admin_accept_waitlist_invitation is recorded as applied on production, but
--    neither function exists there.
-- 3. Tables and private functions created before 2026-08-20 carry extra grants on production:
--    anon and authenticated hold every table privilege, and anon, authenticated and service_role
--    can execute every private function. RLS still gated the rows; the grants removed the
--    second layer.
--
-- Definitions and privileges below are taken from the dev project, where they match the
-- migrations. Every statement is idempotent, so on dev this leaves the schema unchanged.

-- 1. Service request checks and the submission function, with single backslashes.
alter table public.service_requests
  drop constraint if exists service_requests_saudi_mobile_valid,
  drop constraint if exists service_requests_email_valid;

alter table public.service_requests
  add constraint service_requests_saudi_mobile_valid
    check (phone_e164 ~ '^\+9665[0-9]{8}$'),
  add constraint service_requests_email_valid
    check (
      email is null
      or (
        length(email) <= 254
        and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      )
    );

CREATE OR REPLACE FUNCTION private.submit_service_request(p_request_kind text, p_requester_name text, p_phone_e164 text, p_email text, p_use_or_occasion_type text, p_requested_date date, p_requested_start_time time without time zone, p_requested_end_time time without time zone, p_attendee_count integer, p_workshop_title text, p_workshop_description text, p_workshop_target_audience text, p_workshop_duration text, p_workshop_expected_attendance integer, p_workshop_requirements text, p_workshop_portfolio_url text, p_notes text, p_management_token_hash text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  normalized_kind text := btrim(p_request_kind);
  normalized_name text := btrim(p_requester_name);
  normalized_phone text := btrim(p_phone_e164);
  normalized_email text := nullif(lower(btrim(p_email)), '');
  normalized_use text := nullif(btrim(p_use_or_occasion_type), '');
  normalized_title text := nullif(btrim(p_workshop_title), '');
  normalized_description text := nullif(btrim(p_workshop_description), '');
  normalized_target_audience text := nullif(btrim(p_workshop_target_audience), '');
  normalized_duration text := nullif(btrim(p_workshop_duration), '');
  normalized_requirements text := nullif(btrim(p_workshop_requirements), '');
  normalized_portfolio_url text := nullif(btrim(p_workshop_portfolio_url), '');
  normalized_notes text := nullif(btrim(p_notes), '');
  request_reference uuid;
begin
  if normalized_kind not in ('space_booking', 'celebration_booking', 'workshop_application')
    or length(normalized_name) not between 2 and 120
    or normalized_phone !~ '^\+9665[0-9]{8}$'
    or p_management_token_hash !~ '^[a-f0-9]{64}$'
    or (
      normalized_email is not null
      and (
        length(normalized_email) > 254
        or normalized_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      )
    )
    or (normalized_notes is not null and length(normalized_notes) > 4000)
  then
    raise sqlstate 'P0001' using message = 'invalid_service_request';
  end if;

  if normalized_kind in ('space_booking', 'celebration_booking') then
    if normalized_use is null
      or length(normalized_use) not between 2 and 160
      or p_requested_date is null
      or p_requested_start_time is null
      or p_requested_end_time is null
      or p_requested_start_time >= p_requested_end_time
      or p_attendee_count is null
      or p_attendee_count < 1
    then
      raise sqlstate 'P0001' using message = 'invalid_service_request';
    end if;
  else
    if normalized_title is null
      or length(normalized_title) not between 2 and 200
      or normalized_description is null
      or length(normalized_description) not between 2 and 4000
      or normalized_target_audience is null
      or length(normalized_target_audience) not between 2 and 200
      or normalized_duration is null
      or length(normalized_duration) not between 1 and 160
      or p_workshop_expected_attendance is null
      or p_workshop_expected_attendance < 1
      or normalized_requirements is null
      or length(normalized_requirements) not between 1 and 2000
      or (
        normalized_portfolio_url is not null
        and normalized_portfolio_url !~* '^https?://[^[:space:]]+$'
      )
    then
      raise sqlstate 'P0001' using message = 'invalid_service_request';
    end if;
  end if;

  insert into public.service_requests (
    request_kind,
    requester_name,
    phone_e164,
    email,
    use_or_occasion_type,
    requested_date,
    requested_start_time,
    requested_end_time,
    attendee_count,
    workshop_title,
    workshop_description,
    workshop_target_audience,
    workshop_duration,
    workshop_expected_attendance,
    workshop_requirements,
    workshop_portfolio_url,
    notes,
    management_token_hash
  )
  values (
    normalized_kind,
    normalized_name,
    normalized_phone,
    normalized_email,
    case when normalized_kind in ('space_booking', 'celebration_booking') then normalized_use end,
    case when normalized_kind in ('space_booking', 'celebration_booking') then p_requested_date end,
    case when normalized_kind in ('space_booking', 'celebration_booking') then p_requested_start_time end,
    case when normalized_kind in ('space_booking', 'celebration_booking') then p_requested_end_time end,
    case when normalized_kind in ('space_booking', 'celebration_booking') then p_attendee_count end,
    case when normalized_kind = 'workshop_application' then normalized_title end,
    case when normalized_kind = 'workshop_application' then normalized_description end,
    case when normalized_kind = 'workshop_application' then normalized_target_audience end,
    case when normalized_kind = 'workshop_application' then normalized_duration end,
    case when normalized_kind = 'workshop_application' then p_workshop_expected_attendance end,
    case when normalized_kind = 'workshop_application' then normalized_requirements end,
    case when normalized_kind = 'workshop_application' then normalized_portfolio_url end,
    normalized_notes,
    p_management_token_hash
  )
  returning public_reference into request_reference;

  return request_reference;
end;
$function$;

-- 2. Admin acceptance of a waitlist invitation.
CREATE OR REPLACE FUNCTION private.admin_accept_waitlist_invitation(p_registration_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  selected_event_id uuid;
  selected_registration public.registrations%rowtype;
  selected_event public.events%rowtype;
  registered_count integer;
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

  select *
  into selected_event
  from public.events
  where id = selected_event_id
  for update;

  select *
  into selected_registration
  from public.registrations
  where id = p_registration_id
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
  where id = p_registration_id;
end;
$function$;

comment on function private.admin_accept_waitlist_invitation(uuid) is
  'Admin-initiated equivalent of public.accept_waitlist_invitation, for a guest who accepted by phone or WhatsApp instead of their own invitation link.';

CREATE OR REPLACE FUNCTION public.admin_accept_waitlist_invitation(p_registration_id uuid)
 RETURNS void
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select private.admin_accept_waitlist_invitation(p_registration_id);
$function$;

-- 3. Privileges, reset to exactly what the migrations grant.
revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

revoke all on table public.event_feedback_links from anon, authenticated;
grant select on table public.event_feedback_links to authenticated;

revoke all on table public.events from anon, authenticated;
grant select on table public.events to anon;
grant insert, select, update, delete on table public.events to authenticated;

revoke all on table public.interested_contacts from anon, authenticated;
grant select on table public.interested_contacts to authenticated;

revoke all on table public.manual_messages from anon, authenticated;
grant select on table public.manual_messages to authenticated;

revoke all on table public.message_templates from anon, authenticated;
grant insert, select, update, delete on table public.message_templates to authenticated;

revoke all on table public.registration_reminders from anon, authenticated;
grant select on table public.registration_reminders to authenticated;

revoke all on table public.registrations from anon, authenticated;
grant select on table public.registrations to authenticated;

revoke all on table public.service_requests from anon, authenticated;
grant select on table public.service_requests to authenticated;

revoke all on table public.site_settings from anon, authenticated;
grant select on table public.site_settings to anon;
grant insert, select, update on table public.site_settings to authenticated;

revoke all on function private.accept_waitlist_invitation(p_invitation_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.accept_waitlist_invitation(p_invitation_token_hash text) to service_role, anon, authenticated;

revoke all on function private.admin_accept_waitlist_invitation(p_registration_id uuid) from public, anon, authenticated, service_role;
grant execute on function private.admin_accept_waitlist_invitation(p_registration_id uuid) to authenticated;

revoke all on function private.cancel_booking_by_token(p_booking_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.cancel_booking_by_token(p_booking_token_hash text) to service_role, anon, authenticated;

revoke all on function private.cancel_registration(p_registration_id uuid) from public, anon, authenticated, service_role;
grant execute on function private.cancel_registration(p_registration_id uuid) to service_role, authenticated;

revoke all on function private.cancel_service_request_by_token(p_management_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.cancel_service_request_by_token(p_management_token_hash text) to anon, authenticated;

revoke all on function private.confirm_booking_attendance_by_token(p_booking_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.confirm_booking_attendance_by_token(p_booking_token_hash text) to service_role, anon, authenticated;

revoke all on function private.confirm_registration_attendance(p_registration_id uuid) from public, anon, authenticated, service_role;
grant execute on function private.confirm_registration_attendance(p_registration_id uuid) to service_role, authenticated;

revoke all on function private.create_service_request_offer(p_request_id uuid, p_price_halalas integer, p_terms text, p_expires_at timestamp with time zone) from public, anon, authenticated, service_role;
grant execute on function private.create_service_request_offer(p_request_id uuid, p_price_halalas integer, p_terms text, p_expires_at timestamp with time zone) to authenticated;

revoke all on function private.delete_expired_registration_data() from public, anon, authenticated, service_role;

revoke all on function private.delete_expired_service_request_data() from public, anon, authenticated, service_role;

revoke all on function private.enforce_event_capacity() from public, anon, authenticated, service_role;

revoke all on function private.expire_waitlist_invitations(p_event_id uuid) from public, anon, authenticated, service_role;

revoke all on function private.get_booking_by_token(p_booking_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.get_booking_by_token(p_booking_token_hash text) to service_role, anon, authenticated;

revoke all on function private.get_event_feedback_by_token(p_feedback_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.get_event_feedback_by_token(p_feedback_token_hash text) to anon, authenticated;

revoke all on function private.get_event_registration_states() from public, anon, authenticated, service_role;
grant execute on function private.get_event_registration_states() to service_role, anon, authenticated;

revoke all on function private.get_service_request_by_token(p_management_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.get_service_request_by_token(p_management_token_hash text) to anon, authenticated;

revoke all on function private.get_service_request_conflicts(p_request_id uuid) from public, anon, authenticated, service_role;
grant execute on function private.get_service_request_conflicts(p_request_id uuid) to authenticated;

revoke all on function private.get_waitlist_invitation(p_invitation_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.get_waitlist_invitation(p_invitation_token_hash text) to service_role, anon, authenticated;

revoke all on function private.invalidate_registration_reminders_on_cancellation() from public, anon, authenticated, service_role;

revoke all on function private.invite_waitlisted_registration(p_registration_id uuid, p_invitation_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.invite_waitlisted_registration(p_registration_id uuid, p_invitation_token_hash text) to service_role, authenticated;

revoke all on function private.is_admin() from public, anon, authenticated, service_role;
grant execute on function private.is_admin() to authenticated;

revoke all on function private.issue_event_feedback_link(p_registration_id uuid, p_feedback_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.issue_event_feedback_link(p_registration_id uuid, p_feedback_token_hash text) to authenticated;

revoke all on function private.issue_registration_reminder(p_registration_id uuid, p_management_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.issue_registration_reminder(p_registration_id uuid, p_management_token_hash text) to authenticated;

revoke all on function private.mark_manual_message_sent(p_message_id uuid) from public, anon, authenticated, service_role;
grant execute on function private.mark_manual_message_sent(p_message_id uuid) to authenticated;

revoke all on function private.mark_registration_confirmation_sent(p_registration_id uuid) from public, anon, authenticated, service_role;
grant execute on function private.mark_registration_confirmation_sent(p_registration_id uuid) to authenticated;

revoke all on function private.mark_registration_reminder_sent(p_reminder_id uuid) from public, anon, authenticated, service_role;
grant execute on function private.mark_registration_reminder_sent(p_reminder_id uuid) to authenticated;

revoke all on function private.mark_service_request_contacted(p_request_id uuid) from public, anon, authenticated, service_role;
grant execute on function private.mark_service_request_contacted(p_request_id uuid) to authenticated;

revoke all on function private.prepare_manual_registration_message(p_registration_id uuid, p_message_kind text, p_secure_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.prepare_manual_registration_message(p_registration_id uuid, p_message_kind text, p_secure_token_hash text) to authenticated;

revoke all on function private.record_registration_check_in(p_registration_id uuid, p_check_in_status text) from public, anon, authenticated, service_role;
grant execute on function private.record_registration_check_in(p_registration_id uuid, p_check_in_status text) to authenticated;

revoke all on function private.register_for_event(p_event_id uuid, p_attendee_name text, p_phone_e164 text, p_email text, p_guardian_name text, p_participant_age integer, p_guardian_consent boolean, p_booking_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.register_for_event(p_event_id uuid, p_attendee_name text, p_phone_e164 text, p_email text, p_guardian_name text, p_participant_age integer, p_guardian_consent boolean, p_booking_token_hash text) to service_role, anon, authenticated;

revoke all on function private.reject_retired_service_request_kind() from public, anon, authenticated, service_role;

revoke all on function private.respond_to_service_request_offer(p_management_token_hash text, p_response text) from public, anon, authenticated, service_role;
grant execute on function private.respond_to_service_request_offer(p_management_token_hash text, p_response text) to anon, authenticated;

revoke all on function private.revoke_waitlist_invitation(p_registration_id uuid) from public, anon, authenticated, service_role;
grant execute on function private.revoke_waitlist_invitation(p_registration_id uuid) to service_role, authenticated;

revoke all on function private.schedule_service_request_retention() from public, anon, authenticated, service_role;

revoke all on function private.set_registration_payment_status(p_registration_id uuid, p_payment_status text) from public, anon, authenticated, service_role;
grant execute on function private.set_registration_payment_status(p_registration_id uuid, p_payment_status text) to authenticated;

revoke all on function private.set_service_request_payment_status(p_request_id uuid, p_payment_status text) from public, anon, authenticated, service_role;
grant execute on function private.set_service_request_payment_status(p_request_id uuid, p_payment_status text) to authenticated;

revoke all on function private.set_updated_at() from public, anon, authenticated, service_role;

revoke all on function private.start_service_request_review(p_request_id uuid) from public, anon, authenticated, service_role;
grant execute on function private.start_service_request_review(p_request_id uuid) to authenticated;

revoke all on function private.submit_event_feedback_by_token(p_feedback_token_hash text, p_hospitality_rating smallint, p_material_rating smallint, p_suggestions text, p_identity_visible boolean) from public, anon, authenticated, service_role;
grant execute on function private.submit_event_feedback_by_token(p_feedback_token_hash text, p_hospitality_rating smallint, p_material_rating smallint, p_suggestions text, p_identity_visible boolean) to anon, authenticated;

revoke all on function private.submit_interested_contact(p_contact_name text, p_phone_e164 text, p_email text, p_unsubscribe_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.submit_interested_contact(p_contact_name text, p_phone_e164 text, p_email text, p_unsubscribe_token_hash text) to anon, authenticated;

revoke all on function private.submit_service_request(p_request_kind text, p_requester_name text, p_phone_e164 text, p_email text, p_use_or_occasion_type text, p_requested_date date, p_requested_start_time time without time zone, p_requested_end_time time without time zone, p_attendee_count integer, p_workshop_title text, p_workshop_description text, p_workshop_target_audience text, p_workshop_duration text, p_workshop_expected_attendance integer, p_workshop_requirements text, p_workshop_portfolio_url text, p_notes text, p_management_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.submit_service_request(p_request_kind text, p_requester_name text, p_phone_e164 text, p_email text, p_use_or_occasion_type text, p_requested_date date, p_requested_start_time time without time zone, p_requested_end_time time without time zone, p_attendee_count integer, p_workshop_title text, p_workshop_description text, p_workshop_target_audience text, p_workshop_duration text, p_workshop_expected_attendance integer, p_workshop_requirements text, p_workshop_portfolio_url text, p_notes text, p_management_token_hash text) to anon, authenticated;

revoke all on function private.sync_registration_retention() from public, anon, authenticated, service_role;

revoke all on function private.unsubscribe_interested_contact(p_unsubscribe_token_hash text) from public, anon, authenticated, service_role;
grant execute on function private.unsubscribe_interested_contact(p_unsubscribe_token_hash text) to anon, authenticated;

revoke all on function public.admin_accept_waitlist_invitation(p_registration_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.admin_accept_waitlist_invitation(p_registration_id uuid) to service_role, authenticated;

revoke usage on schema private from service_role;
