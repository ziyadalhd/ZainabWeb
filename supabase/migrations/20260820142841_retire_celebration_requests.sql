-- Celebration requests are retained for historical integrity but no new row
-- may use the retired request kind.
create or replace function private.reject_retired_service_request_kind()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.request_kind = 'celebration_booking' then
    raise sqlstate 'P0001' using message = 'service_request_kind_retired';
  end if;
  return new;
end;
$$;

revoke all on function private.reject_retired_service_request_kind() from public, anon, authenticated;

drop trigger if exists service_requests_reject_retired_kind on public.service_requests;
create trigger service_requests_reject_retired_kind
before insert or update of request_kind on public.service_requests
for each row execute function private.reject_retired_service_request_kind();
