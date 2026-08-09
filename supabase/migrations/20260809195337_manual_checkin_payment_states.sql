alter table public.registrations
  add column check_in_status text not null default 'pending'
    constraint registrations_check_in_status_valid
    check (check_in_status in ('pending', 'checked_in', 'absent')),
  add column checked_in_at timestamptz,
  add constraint registrations_checked_in_timestamp_valid
    check (
      (check_in_status = 'checked_in' and checked_in_at is not null)
      or (check_in_status <> 'checked_in' and checked_in_at is null)
    );

comment on column public.registrations.check_in_status is
  'Administrator-recorded event check-in outcome. It is separate from a guest attendance confirmation.';
comment on column public.registrations.checked_in_at is
  'Timestamp when an administrator recorded an attended check-in.';

create function private.record_registration_check_in(
  p_registration_id uuid,
  p_check_in_status text
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

  if p_check_in_status not in ('checked_in', 'absent') then
    raise sqlstate 'P0001' using message = 'invalid_check_in_status';
  end if;

  update public.registrations
  set
    check_in_status = p_check_in_status,
    checked_in_at = case when p_check_in_status = 'checked_in' then now() else null end
  where id = p_registration_id
    and status = 'registered';

  if not found then
    raise sqlstate 'P0001' using message = 'registration_not_active';
  end if;
end;
$$;

revoke all on function private.record_registration_check_in(uuid, text)
  from public, anon, authenticated;

create function public.record_registration_check_in(
  p_registration_id uuid,
  p_check_in_status text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.record_registration_check_in(
    p_registration_id,
    p_check_in_status
  );
$$;

revoke all on function public.record_registration_check_in(uuid, text)
  from public, anon, authenticated;
grant execute on function public.record_registration_check_in(uuid, text)
  to authenticated;

comment on function public.record_registration_check_in(uuid, text) is
  'Invoker wrapper for administrator-only check-in recording. The private helper has a fixed search path and performs the admin authorization check.';
