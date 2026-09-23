begin;

set local search_path = public, extensions;
-- Run fixtures as postgres explicitly: the CLI connects to a hosted project as an unprivileged login
-- role, so neither the session role nor `reset role` can be relied on to reach the setup privileges.
set local role postgres;

select plan(14);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-4555-8555-555555555555',
    'authenticated', 'authenticated', 'service-request-admin@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(), now(), now()
  );

insert into public.admin_users (user_id)
values ('55555555-5555-4555-8555-555555555555');

set local role anon;

select ok(
  not has_table_privilege('anon', 'public.service_requests', 'select'),
  'anon has no direct read privilege on service requests'
);

select ok(
  public.submit_service_request(
    'space_booking', 'طلب اختبار', '+966500000008', '',
    'لقاء ثقافي', date '2027-01-10', time '17:00', time '19:00', 20,
    '', '', '', '', null, '', '', '', repeat('a', 64)
  ) is not null,
  'anon can submit a valid space request only through the scoped RPC'
);

select is(
  (select request_status from public.get_service_request_by_token(repeat('a', 64))),
  'new',
  'secure token reads only its own new request'
);

select throws_ok(
  $$select public.submit_service_request('space_booking', 'طلب اختبار', '+966500000007', '', '', null, null, null, null, '', '', '', '', null, '', '', '', repeat('b', 64))$$,
  'P0001',
  'invalid_service_request',
  'invalid public request input is rejected'
);

select public.submit_service_request(
  'space_booking', 'طلب عرض', '+966500000006', '',
  'ورشة خاصة', date '2027-01-11', time '17:00', time '19:00', 15,
  '', '', '', '', null, '', '', '', repeat('c', 64)
);

select lives_ok(
  $$select public.cancel_service_request_by_token(repeat('a', 64))$$,
  'guest can cancel its request with the management token'
);

set local role postgres;

select is(
  (select status from public.service_requests where management_token_hash = repeat('a', 64)),
  'cancelled',
  'cancellation updates the retained request state'
);

select ok(
  (select retention_until between now() + interval '89 days' and now() + interval '91 days' from public.service_requests where management_token_hash = repeat('a', 64)),
  'terminal request receives the approved 90-day retention deadline'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claims', '{"aal":"aal2"}', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.create_service_request_offer(
    (select id from public.service_requests where management_token_hash = repeat('c', 64)),
    10000, 'عرض اختبار', null
  )$$,
  'admin can create an offer only through the protected RPC'
);

set local role postgres;
set local role anon;

select ok(
  public.submit_service_request(
    'space_booking', 'طلب متداخل', '+966500000005', '',
    'لقاء متداخل', date '2027-01-11', time '18:00', time '20:00', 12,
    '', '', '', '', null, '', '', '', repeat('d', 64)
  ) is not null,
  'anon can submit a second booking request for conflict review'
);

set local role postgres;
set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claims', '{"aal":"aal2"}', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.start_service_request_review((select id from public.service_requests where management_token_hash = repeat('d', 64)))$$,
  'admin can move an overlapping request into review'
);

select is(
  (select count(*) from public.get_service_request_conflicts((select id from public.service_requests where management_token_hash = repeat('c', 64))))::integer,
  1,
  'admin sees an overlapping request as a conflict warning'
);

set local role postgres;
set local role anon;

select lives_ok(
  $$select public.respond_to_service_request_offer(repeat('c', 64), 'accepted')$$,
  'requester can accept an active offer only with its secure token'
);

set local role postgres;
set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select set_config('request.jwt.claims', '{"aal":"aal2"}', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.set_service_request_payment_status((select id from public.service_requests where management_token_hash = repeat('c', 64)), 'deposit_paid')$$,
  'admin can record a payment status only after acceptance'
);

select is(
  (select payment_status from public.service_requests where management_token_hash = repeat('c', 64)),
  'deposit_paid',
  'payment state is retained independently from request acceptance'
);

select * from finish();
rollback;
