-- Corrective migration to fix regex matching and validation in submit_service_request

create or replace function private.submit_service_request(
  p_request_kind text,
  p_requester_name text,
  p_phone_e164 text,
  p_email text,
  p_use_or_occasion_type text,
  p_requested_date date,
  p_requested_start_time time,
  p_requested_end_time time,
  p_attendee_count integer,
  p_workshop_title text,
  p_workshop_description text,
  p_workshop_target_audience text,
  p_workshop_duration text,
  p_workshop_expected_attendance integer,
  p_workshop_requirements text,
  p_workshop_portfolio_url text,
  p_notes text,
  p_management_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
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
$$;
