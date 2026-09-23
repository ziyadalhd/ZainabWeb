begin;

set local search_path = public, extensions;
-- Run fixtures as postgres explicitly: the CLI connects to a hosted project as an unprivileged login
-- role, so neither the session role nor `reset role` can be relied on to reach the setup privileges.
set local role postgres;

select plan(7);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'c1111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'content-admin@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'c2222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'content-member@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(), now(), now()
  );

insert into public.admin_users (user_id)
values ('c1111111-1111-4111-8111-111111111111');

set local role anon;

select is(
  (select contact_phone from public.site_settings where id),
  '0537918640',
  'public visitors can read the approved contact setting'
);

select is(
  (select default_venue_map_url from public.site_settings where id),
  'https://maps.app.goo.gl/Seti5sBZvmhaHeNe8?g_st=ic',
  'the approved public venue map link is seeded'
);

select throws_ok(
  $$update public.site_settings set contact_phone = '0555555555' where id$$,
  '42501',
  null,
  'anonymous callers cannot update site settings'
);

set local role postgres;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c2222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claims', '{"aal":"aal1"}', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$update public.site_settings set contact_phone = '0555555555' where id$$,
  'non-admin update attempt does not bypass RLS'
);

select is(
  (select contact_phone from public.site_settings where id),
  '0537918640',
  'non-admin update affects no public content'
);

set local role postgres;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"aal":"aal2"}', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$update public.site_settings set default_venue_name = 'مقر اختبار' where id$$,
  'approved admin can update site settings'
);

select throws_ok(
  $$update public.site_settings set default_venue_map_url = 'javascript:alert(1)' where id$$,
  '23514',
  null,
  'venue map link must be a web URL'
);

select * from finish();
rollback;
