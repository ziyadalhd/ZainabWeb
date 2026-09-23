begin;

set local search_path = public, extensions;
-- Run fixtures as postgres explicitly: the CLI connects to a hosted project as an unprivileged login
-- role, so neither the session role nor `reset role` can be relied on to reach the setup privileges.
set local role postgres;

select plan(35);

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
  ends_at,
  capacity,
  price_halalas,
  registration_status,
  publication_status
)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'منشورة قادمة', 'adults', 'لقاء', now() + interval '7 days', now() + interval '7 days 2 hours', 20, 0, 'open', 'published'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'مسودة قادمة', 'youth', 'ورشة', now() + interval '8 days', now() + interval '8 days 2 hours', 15, 7500, 'open', 'draft'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'مؤرشفة قادمة', 'children', 'قراءة', now() + interval '9 days', now() + interval '9 days 2 hours', 10, 5000, 'closed', 'archived'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'منشورة سابقة', 'adults', 'لقاء', now() - interval '1 day', now() - interval '22 hours', 20, 0, 'open', 'published'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'مؤرشفة سابقة', 'adults', 'لقاء', now() - interval '2 days', now() - interval '46 hours', 20, 0, 'closed', 'archived'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'ملغاة سابقة', 'adults', 'لقاء', now() - interval '3 days', now() - interval '70 hours', 20, 0, 'closed', 'cancelled');

-- Seeded as the migration role so RLS does not gate the fixture. Registrations exist to prove the
-- delete guard below: an event anyone registered for must stay undeletable.
insert into public.registrations (
  id,
  event_id,
  attendee_name,
  phone_e164,
  status,
  retention_until,
  price_halalas_at_booking
)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'مسجلة',
  '+966500000001',
  'registered',
  now() + interval '120 days',
  0
);

-- One permissive SELECT policy per role, so each read evaluates a single rule
-- (performance advisor: multiple_permissive_policies).
select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'events' and cmd = 'SELECT' and 'anon' = any(roles)),
  1,
  'anon has exactly one select policy on events'
);

select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'events' and cmd = 'SELECT' and 'authenticated' = any(roles)),
  1,
  'authenticated has exactly one select policy on events'
);

set local role anon;

select is(
  (select count(*)::integer from public.events where id::text like 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa%'),
  2,
  'anon sees published events, upcoming or ended, and nothing else'
);

select is(
  (select title from public.events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'),
  'منشورة سابقة',
  'anon sees a published event that has ended, for the public archive'
);

select is(
  (select count(*)::integer from public.events where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6')),
  0,
  'anon never sees an archived or cancelled past event: archiving hides it from the archive'
);

select throws_ok(
  $$delete from public.events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'$$,
  '42501',
  null,
  'anon has no delete grant at all'
);

select is(
  (select count(*)::integer from public.events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  1,
  'anon delete removed no rows'
);

select is(
  (select title from public.events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  'منشورة قادمة',
  'anon sees the expected published event'
);

select throws_ok(
  $$insert into public.events (title, audience, event_type_label, starts_at, capacity) values ('ممنوع', 'adults', 'لقاء', now(), 1)$$,
  '42501',
  null,
  'anon cannot create events'
);

set local role postgres;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"aal":"aal1"}', true);

select is(
  (select count(*)::integer from public.events where id::text like 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa%'),
  2,
  'non-admin authenticated user only sees the public rows'
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

select lives_ok(
  $$delete from public.events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'$$,
  'non-admin delete is filtered by RLS rather than erroring'
);

select is(
  (select count(*)::integer from public.events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  1,
  'non-admin delete removed no rows'
);

set local role postgres;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claims', '{"aal":"aal1"}', true);

select is(
  (select count(*)::integer from public.events where id::text like 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa%'),
  2,
  'approved admin at aal1 sees only the public events'
);

select lives_ok(
  $$update public.events set title = 'محاولة قبل التحقق' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'$$,
  'an aal1 update is rejected without leaking an authorization error'
);

select is(
  (select title from public.events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
  null,
  'approved admin at aal1 cannot read or change the draft event'
);

select set_config('request.jwt.claims', '{"aal":"aal2"}', true);

select is(
  (select title from public.events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
  'مسودة قادمة',
  'the aal1 update did not change the protected draft event'
);

select is(
  (select count(*)::integer from public.events where id::text like 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa%'),
  6,
  'approved admin sees all events'
);

select is(
  (select title from public.events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  'منشورة قادمة',
  'non-admin update affected no rows'
);

select lives_ok(
  $$insert into public.events (title, audience, event_type_label, starts_at, ends_at, capacity, price_halalas) values ('مسودة جديدة', 'adults', 'لقاء', now() + interval '10 days', now() + interval '10 days 2 hours', 25, 10000)$$,
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

select is(
  (select event_kind from public.events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  'club_event',
  'existing events safely default to the club event kind'
);

select lives_ok(
  $$insert into public.events (title, audience, event_kind, event_type_label, starts_at, ends_at, capacity, price_halalas) values ('رحلة اختبار', 'adults', 'bayn_trip', 'رحلة', now() + interval '10 days', now() + interval '10 days 2 hours', 25, 10000)$$,
  'approved admin can classify an event as a Bayn trip'
);

select throws_ok(
  $$insert into public.events (title, audience, event_kind, event_type_label, starts_at, ends_at, capacity, price_halalas) values ('تصنيف خاطئ', 'adults', 'other', 'لقاء', now() + interval '10 days', now() + interval '10 days 2 hours', 25, 10000)$$,
  '23514',
  null,
  'database rejects an unknown event kind'
);

select throws_ok(
  $$insert into public.events (title, audience, event_type_label, starts_at, ends_at, capacity, price_halalas) values ('سعة زائدة', 'adults', 'لقاء', now() + interval '11 days', now() + interval '11 days 2 hours', 51, 0)$$,
  '23514',
  null,
  'database rejects capacity above 50'
);

select throws_ok(
  $$insert into public.events (title, audience, event_type_label, starts_at, ends_at, capacity, price_halalas) values ('نهاية خاطئة', 'adults', 'لقاء', now() + interval '12 days', now() + interval '12 days', 20, 0)$$,
  '23514',
  null,
  'database rejects an end time that is not after the start'
);

select throws_ok(
  $$insert into public.events (title, audience, event_type_label, starts_at, ends_at, capacity, price_halalas) values ('سعر خاطئ', 'adults', 'لقاء', now() + interval '13 days', now() + interval '13 days 2 hours', 20, -1)$$,
  '23514',
  null,
  'database rejects a negative price'
);

-- Deletion is available to an approved admin at aal2, but only for an event with no attendee
-- history: registrations.event_id and event_feedback_links.event_id are `on delete restrict`, which is
-- what keeps AGENTS.md §263 (cancel, never hard-delete, once anyone has registered) enforced in
-- the database rather than only in the application.
select ok(
  has_table_privilege('authenticated', 'public.events', 'DELETE'),
  'authenticated role has the delete privilege the admin policy gates'
);

select throws_ok(
  $$delete from public.events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'$$,
  '23503',
  null,
  'an event with registrations cannot be hard-deleted even by an approved admin'
);

select lives_ok(
  $$delete from public.events where title = 'مسودة جديدة'$$,
  'approved admin can delete an event that has no registrations'
);

select is(
  (select count(*)::integer from public.events where title = 'مسودة جديدة'),
  0,
  'the deleted event is gone'
);

select set_config('request.jwt.claims', '{"aal":"aal1"}', true);

select lives_ok(
  $$delete from public.events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'$$,
  'an aal1 delete is filtered by RLS rather than erroring'
);

select set_config('request.jwt.claims', '{"aal":"aal2"}', true);

select is(
  (select count(*)::integer from public.events where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'),
  1,
  'an admin without MFA cannot delete an event'
);

select * from finish();
rollback;
