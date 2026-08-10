begin;

set local search_path = public, extensions;

select plan(8);

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

select is(
  public.submit_service_request(
    'space_booking', 'طلب اختبار', '+966500000008', '',
    'لقاء ثقافي', date '2027-01-10', time '17:00', time '19:00', 20,
    '', '', '', '', null, '', '', '', repeat('a', 64)
  )::text,
  (select public_reference::text from public.service_requests where management_token_hash = repeat('a', 64)),
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
  'celebration_booking', 'طلب عرض', '+966500000006', '',
  'حفل خاص', date '2027-01-11', time '17:00', time '19:00', 15,
  '', '', '', '', null, '', '', '', repeat('c', 64)
);

select lives_ok(
  $$select public.cancel_service_request_by_token(repeat('a', 64))$$,
  'guest can cancel its request with the management token'
);

reset role;

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
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.create_service_request_offer(
    (select id from public.service_requests where management_token_hash = repeat('c', 64)),
    10000, 'عرض اختبار', null
  )$$,
  'admin can create an offer only through the protected RPC'
);

select * from finish();
rollback;
