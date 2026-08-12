grant execute on function private.record_registration_check_in(uuid, text)
  to authenticated;

comment on function private.record_registration_check_in(uuid, text) is
  'Internal check-in mutation. Authenticated callers require an administrator identity inside the function; access is granted for the security-invoker public wrapper.';
