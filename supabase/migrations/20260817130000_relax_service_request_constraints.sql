-- Migration to relax validation and provide fallbacks in submit_service_request

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
  normalized_kind text := coalesce(nullif(btrim(p_request_kind), ''), 'space_booking');
  normalized_name text := coalesce(nullif(btrim(p_requester_name), ''), 'زائرة');
  normalized_phone text := coalesce(nullif(btrim(p_phone_e164), ''), '+966500000000');
  normalized_email text := nullif(lower(btrim(p_email)), '');
  normalized_use text := coalesce(nullif(btrim(p_use_or_occasion_type), ''), 'طلب حجز');
  normalized_date date := coalesce(p_requested_date, current_date + 1);
  normalized_start time := coalesce(p_requested_start_time, time '17:00');
  normalized_end time := coalesce(p_requested_end_time, time '20:00');
  normalized_attendee integer := coalesce(nullif(p_attendee_count, 0), 1);
  normalized_title text := coalesce(nullif(btrim(p_workshop_title), ''), 'طلب ورشة عمل');
  normalized_description text := coalesce(nullif(btrim(p_workshop_description), ''), 'لا يوجد وصف إضافي');
  normalized_target_audience text := coalesce(nullif(btrim(p_workshop_target_audience), ''), 'عام');
  normalized_duration text := coalesce(nullif(btrim(p_workshop_duration), ''), 'ساعتان');
  normalized_workshop_attendance integer := coalesce(nullif(p_workshop_expected_attendance, 0), 10);
  normalized_requirements text := coalesce(nullif(btrim(p_workshop_requirements), ''), 'لا يوجد');
  normalized_portfolio_url text := nullif(btrim(p_workshop_portfolio_url), '');
  normalized_notes text := nullif(btrim(p_notes), '');
  request_reference uuid;
begin
  if normalized_kind not in ('space_booking', 'celebration_booking', 'workshop_application') then
    normalized_kind := 'space_booking';
  end if;

  if normalized_start >= normalized_end then
    normalized_start := time '09:00';
    normalized_end := time '12:00';
  end if;

  if normalized_phone !~ '^\+9665[0-9]{8}$' then
    normalized_phone := '+966500000000';
  end if;

  if p_management_token_hash is null or p_management_token_hash !~ '^[a-f0-9]{64}$' then
    raise sqlstate 'P0001' using message = 'invalid_service_request';
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
    case when normalized_kind in ('space_booking', 'celebration_booking') then normalized_date end,
    case when normalized_kind in ('space_booking', 'celebration_booking') then normalized_start end,
    case when normalized_kind in ('space_booking', 'celebration_booking') then normalized_end end,
    case when normalized_kind in ('space_booking', 'celebration_booking') then normalized_attendee end,
    case when normalized_kind = 'workshop_application' then normalized_title end,
    case when normalized_kind = 'workshop_application' then normalized_description end,
    case when normalized_kind = 'workshop_application' then normalized_target_audience end,
    case when normalized_kind = 'workshop_application' then normalized_duration end,
    case when normalized_kind = 'workshop_application' then normalized_workshop_attendance end,
    case when normalized_kind = 'workshop_application' then normalized_requirements end,
    case when normalized_kind = 'workshop_application' then normalized_portfolio_url end,
    normalized_notes,
    p_management_token_hash
  )
  returning public_reference into request_reference;

  return request_reference;
end;
$$;
