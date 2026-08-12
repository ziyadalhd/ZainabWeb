begin;

set local search_path = public, extensions;

select plan(17);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '91111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'reminder-admin@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '94444444-4444-4444-8444-444444444444',
    'authenticated', 'authenticated', 'reminder-member@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(), now(), now()
  );

insert into public.admin_users (user_id)
values ('91111111-1111-4111-8111-111111111111');

insert into public.events (
  id, title, audience, event_type_label, starts_at, ends_at,
  capacity, price_halalas, registration_status, publication_status
)
values (
  '92222222-2222-4222-8222-222222222222',
  'اختبار تذكير آمن', 'adults', 'اختبار',
  now() + interval '2 days', now() + interval '2 days 2 hours',
  5, 0, 'open', 'published'
);

insert into public.registrations (
  id, event_id, attendee_name, phone_e164, status,
  price_halalas_at_booking, retention_until, booking_token_hash
)
values (
  '93333333-3333-4333-8333-333333333333',
  '92222222-2222-4222-8222-222222222222',
  'مسجلة اختبار', '+966500000099', 'registered',
  0, now() + interval '92 days', repeat('b', 64)
), (
  '98888888-8888-4888-8888-888888888888',
  '92222222-2222-4222-8222-222222222222',
  'مسجلة إلغاء إداري', '+966500000097', 'registered',
  0, now() + interval '92 days', repeat('d', 64)
);

set local role anon;

select throws_ok(
  $$select * from public.registration_reminders$$,
  '42501',
  null,
  'anonymous callers cannot read reminder metadata'
);

select throws_ok(
  $$select public.issue_registration_reminder('93333333-3333-4333-8333-333333333333', repeat('a', 64))$$,
  '42501',
  null,
  'anonymous callers cannot issue reminder links'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '94444444-4444-4444-8444-444444444444', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::integer from public.registration_reminders),
  0,
  'non-admin users cannot read reminder metadata'
);

select throws_ok(
  $$select public.issue_registration_reminder('93333333-3333-4333-8333-333333333333', repeat('a', 64))$$,
  '42501',
  'admin_required',
  'non-admin users cannot issue reminder links'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '91111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.issue_registration_reminder('93333333-3333-4333-8333-333333333333', repeat('a', 64))$$,
  'approved admin can issue a person-specific reminder link'
);

select lives_ok(
  $$select public.issue_registration_reminder('98888888-8888-4888-8888-888888888888', repeat('e', 64))$$,
  'approved admin can issue a reminder for a second registration'
);

select lives_ok(
  $$select public.cancel_registration('98888888-8888-4888-8888-888888888888')$$,
  'approved admin can cancel a registration with a prepared reminder'
);

select is(
  (
    select count(*)::integer
    from public.registration_reminders
    where registration_id = '98888888-8888-4888-8888-888888888888'
  ),
  0,
  'administrator cancellation immediately invalidates prepared reminder links'
);

select is(
  (select count(*)::integer from public.registration_reminders),
  1,
  'approved admin can read the issued reminder metadata'
);

select is(
  (select sent_at from public.registration_reminders limit 1),
  null::timestamptz,
  'opening a reminder does not claim it was sent'
);

select lives_ok(
  $$select public.mark_registration_reminder_sent((select id from public.registration_reminders limit 1))$$,
  'approved admin can explicitly mark the manual reminder as sent'
);

select ok(
  (select sent_at is not null from public.registration_reminders limit 1),
  'explicit sent marking records a timestamp'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);

select is(
  (select count(*)::integer from public.get_booking_by_token(repeat('a', 64))),
  1,
  'person-specific reminder token opens the matching booking'
);

select lives_ok(
  $$select public.confirm_booking_attendance_by_token(repeat('a', 64))$$,
  'person-specific reminder token confirms attendance'
);

reset role;
select is(
  (select attendance_status from public.registrations where id = '93333333-3333-4333-8333-333333333333'),
  'confirmed',
  'attendance confirmation is saved on the matching registration'
);

set local role anon;
select lives_ok(
  $$select public.cancel_booking_by_token(repeat('a', 64))$$,
  'person-specific reminder token can cancel the matching booking'
);

reset role;
select ok(
  (
    select status = 'cancelled'
      and not exists (
        select 1 from public.registration_reminders
        where registration_id = '93333333-3333-4333-8333-333333333333'
      )
    from public.registrations
    where id = '93333333-3333-4333-8333-333333333333'
  ),
  'cancellation invalidates all reminder links for the registration'
);

select * from finish();
rollback;
