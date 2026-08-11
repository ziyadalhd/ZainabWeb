begin;

set local search_path = public, extensions;

select plan(11);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'd1111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'contacts-admin@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'd2222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'contacts-member@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(), now(), now()
  );

insert into public.admin_users (user_id)
values ('d1111111-1111-4111-8111-111111111111');

insert into public.events (
  id, title, audience, event_type_label, starts_at, ends_at,
  capacity, price_halalas, registration_status, publication_status
)
values (
  'd3333333-3333-4333-8333-333333333333',
  'فعالية دفع اختبار', 'adults', 'اختبار',
  now() + interval '1 day', now() + interval '2 days',
  5, 0, 'open', 'published'
);

insert into public.registrations (
  id, event_id, attendee_name, phone_e164, status,
  price_halalas_at_booking, retention_until, booking_token_hash
)
values (
  'd4444444-4444-4444-8444-444444444444',
  'd3333333-3333-4333-8333-333333333333',
  'مشاركة دفع', '+966500000097', 'registered',
  0, now() + interval '92 days', repeat('d', 64)
);

set local role anon;

select throws_ok(
  $$select * from public.interested_contacts$$,
  '42501',
  null,
  'anonymous callers cannot read interested-contact personal data'
);

select lives_ok(
  $$select public.submit_interested_contact('مهتمة اختبار', '+966500000096', 'interest@example.test', repeat('a', 64))$$,
  'anonymous visitors can submit the approved consent fields only through the public RPC'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd2222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::integer from public.interested_contacts),
  0,
  'non-admin users cannot list interested contacts'
);

select throws_ok(
  $$select public.set_registration_payment_status('d4444444-4444-4444-8444-444444444444', 'paid_in_full')$$,
  '42501',
  'admin_required',
  'non-admin users cannot record event payments'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::integer from public.interested_contacts),
  1,
  'approved administrators can list consenting contacts'
);

select is(
  (select email from public.interested_contacts where unsubscribe_token_hash = repeat('a', 64)),
  'interest@example.test',
  'the required email is normalized and retained only for administrators'
);

select lives_ok(
  $$select public.set_registration_payment_status('d4444444-4444-4444-8444-444444444444', 'deposit_paid')$$,
  'approved administrator can record a manual event deposit'
);

select is(
  (select payment_status from public.registrations where id = 'd4444444-4444-4444-8444-444444444444'),
  'deposit_paid',
  'event payment state is stored separately from registration and attendance states'
);

select throws_ok(
  $$select public.set_registration_payment_status('d4444444-4444-4444-8444-444444444444', 'settled')$$,
  'P0001',
  'invalid_registration_payment_status',
  'only the approved manual event-payment states are accepted'
);

reset role;
set local role anon;

select lives_ok(
  $$select public.unsubscribe_interested_contact(repeat('a', 64))$$,
  'a secure unsubscribe token can revoke consent without exposing contact data'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  (select unsubscribed_at is not null from public.interested_contacts where unsubscribe_token_hash = repeat('a', 64)),
  'administrator can see that consent was revoked'
);

select * from finish();
rollback;
