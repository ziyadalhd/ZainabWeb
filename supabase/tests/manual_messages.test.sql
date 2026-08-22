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
    'b1111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'manual-message-admin@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'b2222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'manual-message-member@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(), now(), now()
  );

insert into public.admin_users (user_id)
values ('b1111111-1111-4111-8111-111111111111');

insert into public.events (
  id, title, audience, event_type_label, starts_at, ends_at,
  capacity, price_halalas, registration_status, publication_status
)
values (
  'b3333333-3333-4333-8333-333333333333',
  'فعالية رسائل يدوية', 'adults', 'اختبار',
  now() + interval '1 day', now() + interval '1 day 2 hours',
  5, 0, 'open', 'published'
);

insert into public.registrations (
  id, event_id, attendee_name, phone_e164, status,
  price_halalas_at_booking, retention_until, booking_token_hash
)
values (
  'b4444444-4444-4444-8444-444444444444',
  'b3333333-3333-4333-8333-333333333333',
  'مشاركة الرسالة', '+966500000096', 'registered',
  0, now() + interval '91 days', repeat('1', 64)
);

set local role anon;

select throws_ok(
  $$select * from public.manual_messages$$,
  '42501',
  null,
  'anonymous callers cannot read manual message metadata'
);

select throws_ok(
  $$select public.prepare_manual_registration_message('b4444444-4444-4444-8444-444444444444', 'confirmation', repeat('2', 64))$$,
  '42501',
  null,
  'anonymous callers cannot prepare manual messages'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b2222222-2222-4222-8222-222222222222', true);
select set_config('request.jwt.claims', '{"aal":"aal1"}', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::integer from public.manual_messages),
  0,
  'non-admin users cannot read manual message metadata'
);

select throws_ok(
  $$select public.prepare_manual_registration_message('b4444444-4444-4444-8444-444444444444', 'confirmation', repeat('2', 64))$$,
  '42501',
  'admin_required',
  'non-admin users cannot prepare manual messages'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"aal":"aal2"}', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.prepare_manual_registration_message('b4444444-4444-4444-8444-444444444444', 'confirmation', repeat('2', 64))$$,
  'an approved admin can prepare a confirmation'
);

select is(
  (select count(*)::integer from public.manual_messages where sent_at is null and superseded_at is null),
  1,
  'opening preparation creates one current unsent message'
);

select lives_ok(
  $$select public.prepare_manual_registration_message('b4444444-4444-4444-8444-444444444444', 'confirmation', repeat('3', 64))$$,
  'retrying preparation safely replaces the unused link'
);

select is(
  (select count(*)::integer from public.manual_messages where message_kind = 'confirmation' and superseded_at is not null),
  1,
  'the old unused message is superseded'
);

select is(
  (select count(*)::integer from public.manual_messages where message_kind = 'confirmation' and sent_at is null and superseded_at is null),
  1,
  'only one current draft remains per registration and kind'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
select set_config('request.jwt.claim.role', 'anon', true);

select is(
  (select count(*)::integer from public.get_booking_by_token(repeat('2', 64))),
  0,
  'the superseded secure link is invalid'
);

select is(
  (select count(*)::integer from public.get_booking_by_token(repeat('3', 64))),
  1,
  'the current secure link opens only its booking'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"aal":"aal2"}', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.mark_manual_message_sent((select id from public.manual_messages where superseded_at is null limit 1))$$,
  'the admin can explicitly mark the current message sent'
);

select ok(
  (select sent_at is not null from public.manual_messages where superseded_at is null limit 1),
  'manual sent marking records a timestamp'
);

select ok(
  (select confirmation_sent_at is not null from public.registrations where id = 'b4444444-4444-4444-8444-444444444444'),
  'sent confirmation updates the compatible registration completion timestamp'
);

select is(
  (
    select public.mark_manual_message_sent(id)
    from public.manual_messages
    where superseded_at is null
    limit 1
  ),
  (select sent_at from public.manual_messages where superseded_at is null limit 1),
  'repeating sent marking preserves the first timestamp'
);

update public.events
set publication_status = 'cancelled'
where id = 'b3333333-3333-4333-8333-333333333333';

select lives_ok(
  $$select public.prepare_manual_registration_message('b4444444-4444-4444-8444-444444444444', 'cancellation', null)$$,
  'the cancelled event uses a standard notice without a secure token'
);

select is(
  (select secure_token_hash from public.manual_messages where message_kind = 'cancellation'),
  null::text,
  'the cancellation notice stores no unnecessary token'
);

select * from finish();
rollback;
