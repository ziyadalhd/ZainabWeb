create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  public_reference uuid not null default gen_random_uuid() unique,
  request_kind text not null
    constraint service_requests_kind_valid
    check (request_kind in ('space_booking', 'celebration_booking', 'workshop_application')),
  requester_name text not null
    constraint service_requests_requester_name_length
    check (length(btrim(requester_name)) between 2 and 120),
  phone_e164 text not null
    constraint service_requests_saudi_mobile_valid
    check (phone_e164 ~ '^\\+9665[0-9]{8}$'),
  email text
    constraint service_requests_email_valid
    check (
      email is null
      or (
        length(email) <= 254
        and email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'
      )
    ),
  use_or_occasion_type text,
  requested_date date,
  requested_start_time time,
  requested_end_time time,
  attendee_count integer,
  workshop_title text,
  workshop_description text,
  workshop_target_audience text,
  workshop_duration text,
  workshop_expected_attendance integer,
  workshop_requirements text,
  workshop_portfolio_url text,
  notes text,
  status text not null default 'new'
    constraint service_requests_status_valid
    check (status in ('new', 'under_review', 'accepted', 'rejected', 'cancelled')),
  offer_price_halalas integer
    constraint service_requests_offer_price_non_negative
    check (offer_price_halalas is null or offer_price_halalas >= 0),
  offer_terms text,
  offer_expires_at timestamptz,
  offer_responded_at timestamptz,
  management_token_hash text not null unique
    constraint service_requests_management_token_hash_valid
    check (management_token_hash ~ '^[a-f0-9]{64}$'),
  retention_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_requests_booking_shape check (
    (
      request_kind in ('space_booking', 'celebration_booking')
      and use_or_occasion_type is not null
      and length(btrim(use_or_occasion_type)) between 2 and 160
      and requested_date is not null
      and requested_start_time is not null
      and requested_end_time is not null
      and requested_start_time < requested_end_time
      and attendee_count is not null
      and attendee_count > 0
      and workshop_title is null
      and workshop_description is null
      and workshop_target_audience is null
      and workshop_duration is null
      and workshop_expected_attendance is null
      and workshop_requirements is null
      and workshop_portfolio_url is null
    )
    or (
      request_kind = 'workshop_application'
      and use_or_occasion_type is null
      and requested_date is null
      and requested_start_time is null
      and requested_end_time is null
      and attendee_count is null
      and workshop_title is not null
      and length(btrim(workshop_title)) between 2 and 200
      and workshop_description is not null
      and length(btrim(workshop_description)) between 2 and 4000
      and workshop_target_audience is not null
      and length(btrim(workshop_target_audience)) between 2 and 200
      and workshop_duration is not null
      and length(btrim(workshop_duration)) between 1 and 160
      and workshop_expected_attendance is not null
      and workshop_expected_attendance > 0
      and workshop_requirements is not null
      and length(btrim(workshop_requirements)) between 1 and 2000
      and (
        workshop_portfolio_url is null
        or workshop_portfolio_url ~* '^https?://[^[:space:]]+$'
      )
    )
  ),
  constraint service_requests_notes_length
    check (notes is null or length(notes) <= 4000),
  constraint service_requests_offer_shape
    check (
      (offer_price_halalas is null and offer_terms is null and offer_expires_at is null)
      or (
        offer_price_halalas is not null
        and offer_terms is not null
        and length(btrim(offer_terms)) between 1 and 4000
        and offer_expires_at is not null
      )
    )
);

comment on table public.service_requests is
  'Space-booking, celebration-booking, and workshop-application requests. Personal data is restricted to approved administrators.';
comment on column public.service_requests.retention_until is
  'Personal-data deletion deadline: 90 days after a request reaches accepted, rejected, or cancelled.';

create index service_requests_status_created_idx
  on public.service_requests (status, created_at);
create index service_requests_retention_until_idx
  on public.service_requests (retention_until)
  where retention_until is not null;

alter table public.service_requests enable row level security;

revoke all on table public.service_requests from public, anon, authenticated;
grant select on table public.service_requests to authenticated;

create policy service_requests_admin_select
on public.service_requests
for select
to authenticated
using ((select private.is_admin()));

create trigger service_requests_set_updated_at
before update on public.service_requests
for each row
execute function private.set_updated_at();

create or replace function private.schedule_service_request_retention()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('accepted', 'rejected', 'cancelled')
    and old.status not in ('accepted', 'rejected', 'cancelled')
  then
    new.retention_until := now() + interval '90 days';
  end if;
  return new;
end;
$$;

revoke all on function private.schedule_service_request_retention() from public, anon, authenticated;

create trigger service_requests_schedule_retention
before update of status on public.service_requests
for each row
execute function private.schedule_service_request_retention();

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
    or normalized_phone !~ '^\\+9665[0-9]{8}$'
    or p_management_token_hash !~ '^[a-f0-9]{64}$'
    or (
      normalized_email is not null
      and (
        length(normalized_email) > 254
        or normalized_email !~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'
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

create or replace function private.get_service_request_by_token(p_management_token_hash text)
returns table (
  request_kind text,
  requester_name text,
  use_or_occasion_type text,
  requested_date date,
  requested_start_time time,
  requested_end_time time,
  attendee_count integer,
  workshop_title text,
  workshop_description text,
  workshop_target_audience text,
  workshop_duration text,
  workshop_expected_attendance integer,
  workshop_requirements text,
  workshop_portfolio_url text,
  notes text,
  request_status text,
  offer_price_halalas integer,
  offer_terms text,
  offer_expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    request_kind,
    requester_name,
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
    status,
    offer_price_halalas,
    offer_terms,
    offer_expires_at
  from public.service_requests
  where management_token_hash = p_management_token_hash;
$$;

create or replace function private.cancel_service_request_by_token(p_management_token_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.service_requests
  set status = 'cancelled'
  where management_token_hash = p_management_token_hash
    and status <> 'cancelled';

  if not found then
    raise sqlstate 'P0001' using message = 'service_request_unavailable';
  end if;
end;
$$;

create or replace function private.respond_to_service_request_offer(
  p_management_token_hash text,
  p_response text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_response not in ('accepted', 'rejected') then
    raise sqlstate 'P0001' using message = 'invalid_service_request_response';
  end if;

  update public.service_requests
  set status = p_response, offer_responded_at = now()
  where management_token_hash = p_management_token_hash
    and status = 'under_review'
    and offer_price_halalas is not null
    and offer_terms is not null
    and offer_expires_at > now();

  if not found then
    raise sqlstate 'P0001' using message = 'service_offer_unavailable';
  end if;
end;
$$;

create or replace function private.start_service_request_review(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  update public.service_requests
  set status = 'under_review'
  where id = p_request_id
    and status = 'new';

  if not found then
    raise sqlstate 'P0001' using message = 'service_request_unavailable';
  end if;
end;
$$;

create or replace function private.create_service_request_offer(
  p_request_id uuid,
  p_price_halalas integer,
  p_terms text,
  p_expires_at timestamptz default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_expiry timestamptz := coalesce(p_expires_at, now() + interval '48 hours');
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  if p_price_halalas is null
    or p_price_halalas < 0
    or p_terms is null
    or length(btrim(p_terms)) not between 1 and 4000
    or selected_expiry <= now()
  then
    raise sqlstate 'P0001' using message = 'invalid_service_offer';
  end if;

  update public.service_requests
  set
    status = 'under_review',
    offer_price_halalas = p_price_halalas,
    offer_terms = btrim(p_terms),
    offer_expires_at = selected_expiry,
    offer_responded_at = null
  where id = p_request_id
    and status in ('new', 'under_review');

  if not found then
    raise sqlstate 'P0001' using message = 'service_request_unavailable';
  end if;

  return selected_expiry;
end;
$$;

revoke all on function private.submit_service_request(
  text, text, text, text, text, date, time, time, integer, text, text, text, text, integer, text, text, text, text
) from public, anon, authenticated;
revoke all on function private.get_service_request_by_token(text) from public, anon, authenticated;
revoke all on function private.cancel_service_request_by_token(text) from public, anon, authenticated;
revoke all on function private.respond_to_service_request_offer(text, text) from public, anon, authenticated;
revoke all on function private.start_service_request_review(uuid) from public, anon, authenticated;
revoke all on function private.create_service_request_offer(uuid, integer, text, timestamptz) from public, anon, authenticated;

grant usage on schema private to anon, authenticated;
grant execute on function private.submit_service_request(
  text, text, text, text, text, date, time, time, integer, text, text, text, text, integer, text, text, text, text
) to anon, authenticated;
grant execute on function private.get_service_request_by_token(text) to anon, authenticated;
grant execute on function private.cancel_service_request_by_token(text) to anon, authenticated;
grant execute on function private.respond_to_service_request_offer(text, text) to anon, authenticated;
grant execute on function private.start_service_request_review(uuid) to authenticated;
grant execute on function private.create_service_request_offer(uuid, integer, text, timestamptz) to authenticated;

create function public.submit_service_request(
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
language sql
security invoker
set search_path = ''
as $$
  select private.submit_service_request(
    p_request_kind,
    p_requester_name,
    p_phone_e164,
    p_email,
    p_use_or_occasion_type,
    p_requested_date,
    p_requested_start_time,
    p_requested_end_time,
    p_attendee_count,
    p_workshop_title,
    p_workshop_description,
    p_workshop_target_audience,
    p_workshop_duration,
    p_workshop_expected_attendance,
    p_workshop_requirements,
    p_workshop_portfolio_url,
    p_notes,
    p_management_token_hash
  );
$$;

create function public.get_service_request_by_token(p_management_token_hash text)
returns table (
  request_kind text,
  requester_name text,
  use_or_occasion_type text,
  requested_date date,
  requested_start_time time,
  requested_end_time time,
  attendee_count integer,
  workshop_title text,
  workshop_description text,
  workshop_target_audience text,
  workshop_duration text,
  workshop_expected_attendance integer,
  workshop_requirements text,
  workshop_portfolio_url text,
  notes text,
  request_status text,
  offer_price_halalas integer,
  offer_terms text,
  offer_expires_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_service_request_by_token(p_management_token_hash);
$$;

create function public.cancel_service_request_by_token(p_management_token_hash text)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.cancel_service_request_by_token(p_management_token_hash);
$$;

create function public.respond_to_service_request_offer(
  p_management_token_hash text,
  p_response text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.respond_to_service_request_offer(p_management_token_hash, p_response);
$$;

create function public.start_service_request_review(p_request_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.start_service_request_review(p_request_id);
$$;

create function public.create_service_request_offer(
  p_request_id uuid,
  p_price_halalas integer,
  p_terms text,
  p_expires_at timestamptz default null
)
returns timestamptz
language sql
security invoker
set search_path = ''
as $$
  select private.create_service_request_offer(p_request_id, p_price_halalas, p_terms, p_expires_at);
$$;

revoke all on function public.submit_service_request(
  text, text, text, text, text, date, time, time, integer, text, text, text, text, integer, text, text, text, text
) from public, anon, authenticated;
revoke all on function public.get_service_request_by_token(text) from public, anon, authenticated;
revoke all on function public.cancel_service_request_by_token(text) from public, anon, authenticated;
revoke all on function public.respond_to_service_request_offer(text, text) from public, anon, authenticated;
revoke all on function public.start_service_request_review(uuid) from public, anon, authenticated;
revoke all on function public.create_service_request_offer(uuid, integer, text, timestamptz) from public, anon, authenticated;

grant execute on function public.submit_service_request(
  text, text, text, text, text, date, time, time, integer, text, text, text, text, integer, text, text, text, text
) to anon, authenticated;
grant execute on function public.get_service_request_by_token(text) to anon, authenticated;
grant execute on function public.cancel_service_request_by_token(text) to anon, authenticated;
grant execute on function public.respond_to_service_request_offer(text, text) to anon, authenticated;
grant execute on function public.start_service_request_review(uuid) to authenticated;
grant execute on function public.create_service_request_offer(uuid, integer, text, timestamptz) to authenticated;

create or replace function private.delete_expired_service_request_data()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from public.service_requests
  where retention_until is not null
    and retention_until < now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function private.delete_expired_service_request_data() from public, anon, authenticated;

select cron.schedule(
  'delete-expired-service-request-data',
  '45 0 * * *',
  $$select private.delete_expired_service_request_data()$$
);
