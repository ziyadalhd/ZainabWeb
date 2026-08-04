begin;

set local search_path = public, extensions;

select plan(13);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'admin@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'member@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(),
    now(),
    now()
  );

insert into public.admin_users (user_id)
values ('11111111-1111-1111-1111-111111111111');

insert into public.events (
  id,
  title,
  audience,
  event_type_label,
  starts_at,
  capacity,
  availability,
  publication_status
)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'منشورة قادمة', 'adults', 'لقاء', now() + interval '7 days', 20, 'available', 'published'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'مسودة قادمة', 'youth', 'ورشة', now() + interval '8 days', 15, 'available', 'draft'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'مؤرشفة قادمة', 'children', 'قراءة', now() + interval '9 days', 10, 'full', 'archived'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'منشورة سابقة', 'adults', 'لقاء', now() - interval '1 day', 20, 'available', 'published');

set local role anon;

select is(
  (select count(*)::integer from public.events),
  1,
  'anon sees only upcoming published events'
);

select is(
  (select title from public.events),
  'منشورة قادمة',
  'anon sees the expected published event'
);

select throws_ok(
  $$insert into public.events (title, audience, event_type_label, starts_at, capacity) values ('ممنوع', 'adults', 'لقاء', now(), 1)$$,
  '42501',
  null,
  'anon cannot create events'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::integer from public.events),
  1,
  'non-admin authenticated user only sees the public row'
);

select throws_ok(
  $$insert into public.events (title, audience, event_type_label, starts_at, capacity) values ('ممنوع', 'adults', 'لقاء', now(), 1)$$,
  '42501',
  null,
  'non-admin cannot create events'
);

select lives_ok(
  $$update public.events set title = 'تعديل ممنوع' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'$$,
  'non-admin cannot update an event'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::integer from public.events),
  4,
  'approved admin sees all events'
);

select is(
  (select title from public.events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  'منشورة قادمة',
  'non-admin update affected no rows'
);

select lives_ok(
  $$insert into public.events (title, audience, event_type_label, starts_at, capacity) values ('مسودة جديدة', 'adults', 'لقاء', now() + interval '10 days', 25)$$,
  'approved admin can create a draft'
);

select is(
  (select publication_status from public.events where title = 'مسودة جديدة'),
  'draft',
  'new event defaults to draft'
);

select lives_ok(
  $$update public.events set publication_status = 'published' where title = 'مسودة جديدة'$$,
  'approved admin can change publication status'
);

select ok(
  not has_table_privilege('authenticated', 'public.events', 'DELETE'),
  'authenticated role has no hard-delete privilege'
);

select throws_ok(
  $$delete from public.events where title = 'مسودة جديدة'$$,
  '42501',
  null,
  'hard delete is unavailable through the application role'
);

select * from finish();
rollback;
