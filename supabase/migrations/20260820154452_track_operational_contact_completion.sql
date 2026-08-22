alter table public.registrations
  add column confirmation_sent_at timestamptz;

comment on column public.registrations.confirmation_sent_at is
  'Administrator-declared time when the immediate WhatsApp confirmation was sent manually.';

alter table public.service_requests
  add column contacted_at timestamptz;

comment on column public.service_requests.contacted_at is
  'Administrator-declared time when the requester was contacted manually.';

create function private.mark_registration_confirmation_sent(p_registration_id uuid)
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
  set confirmation_sent_at = coalesce(confirmation_sent_at, now())
  where id = p_registration_id
    and status = 'registered';

  if not found then
    raise sqlstate 'P0001' using message = 'registration_not_active';
  end if;
end;
$$;

revoke all on function private.mark_registration_confirmation_sent(uuid) from public, anon, authenticated;
grant execute on function private.mark_registration_confirmation_sent(uuid) to authenticated;

create function public.mark_registration_confirmation_sent(p_registration_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.mark_registration_confirmation_sent(p_registration_id);
$$;

revoke all on function public.mark_registration_confirmation_sent(uuid) from public, anon, authenticated;
grant execute on function public.mark_registration_confirmation_sent(uuid) to authenticated;

create function private.mark_service_request_contacted(p_request_id uuid)
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
  set contacted_at = coalesce(contacted_at, now())
  where id = p_request_id;

  if not found then
    raise sqlstate 'P0001' using message = 'service_request_not_found';
  end if;
end;
$$;

revoke all on function private.mark_service_request_contacted(uuid) from public, anon, authenticated;
grant execute on function private.mark_service_request_contacted(uuid) to authenticated;

create function public.mark_service_request_contacted(p_request_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.mark_service_request_contacted(p_request_id);
$$;

revoke all on function public.mark_service_request_contacted(uuid) from public, anon, authenticated;
grant execute on function public.mark_service_request_contacted(uuid) to authenticated;
