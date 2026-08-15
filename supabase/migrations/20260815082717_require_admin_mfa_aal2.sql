create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
      select 1
      from public.admin_users
      where user_id = (select auth.uid())
    );
$$;

comment on function private.is_admin() is
  'Returns true only for allowlisted administrators whose current Auth session has completed MFA (aal2).';

revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;
