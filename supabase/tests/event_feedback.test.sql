begin;

set local search_path = public, extensions;

select plan(12);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'a1111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'feedback-admin@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a2222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'feedback-member@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(), now(), now()
  );

insert into public.admin_users (user_id)
values ('a1111111-1111-4111-8111-111111111111');

insert into public.events (
  id, title, audience, event_type_label, starts_at, ends_at,
  capacity, price_halalas, registration_status, publication_status
)
values (
  'a3333333-3333-4333-8333-333333333333',
  'فعالية تقييم اختبار', 'adults', 'اختبار',
  now() + interval '1 day', now() + interval '3 days',
  5, 0, 'open', 'published'
);

insert into public.registrations (
  id, event_id, attendee_name, phone_e164, status,
  price_halalas_at_booking, retention_until, booking_token_hash
)
values (
  'a4444444-4444-4444-8444-444444444444',
  'a3333333-3333-4333-8333-333333333333',
  'مشاركة اختبار', '+966500000094', 'registered',
  0, now() + interval '92 days', repeat('b', 64)
);

set local role anon;

select throws_ok(
  $$select * from public.event_feedback_links$$,
  '42501',
  null,
  'anonymous callers cannot read feedback metadata'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claims', '{"aal":"aal1"}', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::integer from public.event_feedback_links),
  0,
  'non-admin users cannot read feedback metadata'
);

select throws_ok(
  $$select public.issue_event_feedback_link('a4444444-4444-4444-8444-444444444444', repeat('a', 64))$$,
  '42501',
  'admin_required',
  'non-admin users cannot issue feedback links'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"aal":"aal2"}', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.issue_event_feedback_link('a4444444-4444-4444-8444-444444444444', repeat('a', 64))$$,
  'approved admin can issue a secure feedback link'
);

select is(
  (select count(*)::integer from public.event_feedback_links),
  1,
  'approved admin can see the issued feedback link'
);

reset role;
set local role anon;

select is(
  (select event_title from public.get_event_feedback_by_token(repeat('a', 64))),
  'فعالية تقييم اختبار',
  'the secure token exposes only the matching event title'
);

select lives_ok(
  $$select public.submit_event_feedback_by_token(repeat('a', 64), 5::smallint, 4::smallint, 'اقتراح اختبار', false)$$,
  'anonymous participant can submit the approved ratings anonymously'
);

select is(
  (select count(*)::integer from public.get_event_feedback_by_token(repeat('a', 64))),
  0,
  'a feedback token cannot be reused after submission'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"aal":"aal2"}', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  (
    select registration_id is null
      and identity_visible is false
      and hospitality_rating = 5
      and material_rating = 4
    from public.event_feedback_links
    where feedback_token_hash = repeat('a', 64)
  ),
  'anonymous submission severs the participant identity before admin viewing'
);

select lives_ok(
  $$select public.issue_event_feedback_link('a4444444-4444-4444-8444-444444444444', repeat('c', 64))$$,
  'approved admin can issue another one-use link after an anonymous response'
);

reset role;
set local role anon;

select lives_ok(
  $$select public.submit_event_feedback_by_token(repeat('c', 64), 3::smallint, 2::smallint, '', true)$$,
  'participant may choose to show her identity'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"aal":"aal2"}', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select registration_id from public.event_feedback_links where feedback_token_hash = repeat('c', 64)),
  'a4444444-4444-4444-8444-444444444444'::uuid,
  'named submission retains the participant reference'
);

select * from finish();
rollback;
