alter table public.service_requests
  add column payment_status text not null default 'unpaid'
    constraint service_requests_payment_status_valid
    check (payment_status in ('unpaid', 'deposit_paid', 'paid_in_full'));

comment on column public.service_requests.payment_status is
  'Administrator-recorded payment state only. The application does not process payments.';

create index service_requests_booking_schedule_idx
  on public.service_requests (requested_date, requested_start_time, requested_end_time)
  where request_kind in ('space_booking', 'celebration_booking')
    and status in ('under_review', 'accepted');

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
    and request_kind in ('space_booking', 'celebration_booking')
    and status in ('new', 'under_review');

  if not found then
    raise sqlstate 'P0001' using message = 'service_request_unavailable';
  end if;

  return selected_expiry;
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
    and request_kind in ('space_booking', 'celebration_booking')
    and status = 'under_review'
    and offer_price_halalas is not null
    and offer_terms is not null
    and offer_expires_at > now();

  if not found then
    raise sqlstate 'P0001' using message = 'service_offer_unavailable';
  end if;
end;
$$;

create or replace function private.set_service_request_payment_status(
  p_request_id uuid,
  p_payment_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  if p_payment_status not in ('unpaid', 'deposit_paid', 'paid_in_full') then
    raise sqlstate 'P0001' using message = 'invalid_service_request_payment_status';
  end if;

  update public.service_requests
  set payment_status = p_payment_status
  where id = p_request_id
    and request_kind in ('space_booking', 'celebration_booking')
    and status = 'accepted';

  if not found then
    raise sqlstate 'P0001' using message = 'service_request_unavailable';
  end if;
end;
$$;

create or replace function private.get_service_request_conflicts(p_request_id uuid)
returns table (
  conflict_source text,
  conflict_title text,
  conflict_starts_at timestamptz,
  conflict_ends_at timestamptz,
  conflict_status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_starts_at timestamptz;
  request_ends_at timestamptz;
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  select
    (requested_date + requested_start_time) at time zone 'Asia/Riyadh',
    (requested_date + requested_end_time) at time zone 'Asia/Riyadh'
  into request_starts_at, request_ends_at
  from public.service_requests
  where id = p_request_id
    and request_kind in ('space_booking', 'celebration_booking');

  if request_starts_at is null or request_ends_at is null then
    raise sqlstate 'P0001' using message = 'service_request_unavailable';
  end if;

  return query
  select
    'event'::text,
    event.title,
    event.starts_at,
    event.ends_at,
    event.publication_status
  from public.events as event
  where event.publication_status <> 'archived'
    and event.ends_at is not null
    and tstzrange(event.starts_at, event.ends_at, '[)')
      && tstzrange(request_starts_at, request_ends_at, '[)')

  union all

  select
    'service_request'::text,
    request.use_or_occasion_type,
    (request.requested_date + request.requested_start_time) at time zone 'Asia/Riyadh',
    (request.requested_date + request.requested_end_time) at time zone 'Asia/Riyadh',
    request.status
  from public.service_requests as request
  where request.id <> p_request_id
    and request.request_kind in ('space_booking', 'celebration_booking')
    and request.status in ('under_review', 'accepted')
    and tstzrange(
      (request.requested_date + request.requested_start_time) at time zone 'Asia/Riyadh',
      (request.requested_date + request.requested_end_time) at time zone 'Asia/Riyadh',
      '[)'
    ) && tstzrange(request_starts_at, request_ends_at, '[)')
  order by 3;
end;
$$;

create or replace function public.set_service_request_payment_status(
  p_request_id uuid,
  p_payment_status text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.set_service_request_payment_status(p_request_id, p_payment_status);
$$;

create or replace function public.get_service_request_conflicts(p_request_id uuid)
returns table (
  conflict_source text,
  conflict_title text,
  conflict_starts_at timestamptz,
  conflict_ends_at timestamptz,
  conflict_status text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_service_request_conflicts(p_request_id);
$$;

revoke all on function private.set_service_request_payment_status(uuid, text) from public, anon, authenticated;
revoke all on function private.get_service_request_conflicts(uuid) from public, anon, authenticated;
revoke all on function public.set_service_request_payment_status(uuid, text) from public, anon, authenticated;
revoke all on function public.get_service_request_conflicts(uuid) from public, anon, authenticated;

grant execute on function private.set_service_request_payment_status(uuid, text) to authenticated;
grant execute on function private.get_service_request_conflicts(uuid) to authenticated;
grant execute on function public.set_service_request_payment_status(uuid, text) to authenticated;
grant execute on function public.get_service_request_conflicts(uuid) to authenticated;
