begin;

set local search_path = public, extensions;

select plan(53);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated', 'authenticated', 'registration-admin@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(), now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-8444-444444444444',
    'authenticated', 'authenticated', 'registration-member@example.test',
    extensions.crypt('testing-only', extensions.gen_salt('bf')),
    now(), now(), now()
  );

insert into public.admin_users (user_id)
values ('33333333-3333-4333-8333-333333333333');

insert into public.events (
  id, title, audience, event_type_label, starts_at, ends_at,
  capacity, price_halalas, registration_status, publication_status
)
values
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'فعالية التسجيل',
    'adults', 'لقاء', now() + interval '7 days', now() + interval '7 days 2 hours',
    1, 5000, 'open', 'published'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'فعالية الصغار',
    'children', 'ورشة', now() + interval '8 days', now() + interval '8 days 2 hours',
    10, 0, 'open', 'published'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'فعالية اليافعات',
    'youth', 'ورشة', now() + interval '9 days', now() + interval '9 days 2 hours',
    10, 2500, 'open', 'published'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', 'تسجيل مغلق',
    'adults', 'لقاء', now() + interval '10 days', now() + interval '10 days 2 hours',
    10, 0, 'closed', 'published'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', 'اختبار سحب الدعوة',
    'adults', 'لقاء', now() + interval '11 days', now() + interval '11 days 2 hours',
    1, 0, 'open', 'published'
  );

set local role anon;

select is(
  (
    select registration_status
    from public.register_for_event(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      'مسجل أول', '+966500000001', 'first@example.test', null, null, false,
      repeat('a', 64)
    )
  ),
  'registered',
  'first guest receives a confirmed seat'
);

select is(
  (
    select registration_status
    from public.register_for_event(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      'مسجل ثان', '+966500000002', 'second@example.test', null, null, false,
      repeat('b', 64)
    )
  ),
  'waitlisted',
  'guest beyond capacity enters the waitlist'
);

select is(
  (
    select registration_status
    from public.register_for_event(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5',
      'مقعد السحب', '+966500000010', '', null, null, false,
      repeat('c', 64)
    )
  ),
  'registered',
  'revoke test event receives its first reservation'
);

select is(
  (
    select registration_status
    from public.register_for_event(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5',
      'انتظار السحب', '+966500000011', '', null, null, false,
      repeat('d', 64)
    )
  ),
  'waitlisted',
  'revoke test event receives a waitlisted reservation'
);

select throws_ok(
  $$select * from public.registrations$$,
  '42501',
  null,
  'anon cannot read registration personal data'
);

select throws_ok(
  $$select * from public.register_for_event('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'مكرر', '+966500000001', '', null, null, false, repeat('e', 64))$$,
  'P0001',
  'duplicate_registration',
  'duplicate adult phone is rejected'
);

select throws_ok(
  $$select * from public.register_for_event('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'طفلة', '+966500000003', '', null, null, false, repeat('f', 64))$$,
  'P0001',
  'minor_registration_invalid',
  'child registration requires age, guardian name and consent'
);

select is(
  (
    select registration_status
    from public.register_for_event(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      'طفلة أولى', '+966500000003', 'guardian@example.test', 'ولية الأمر', 6, true,
      repeat('1', 64)
    )
  ),
  'registered',
  'guardian can register a child aged 6'
);

select is(
  (
    select registration_status
    from public.register_for_event(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      'طفلة ثانية', '+966500000003', 'guardian@example.test', 'ولية الأمر', 12, true,
      repeat('2', 64)
    )
  ),
  'registered',
  'guardian can register another child with the same mobile when names differ'
);

select throws_ok(
  $$select * from public.register_for_event('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'طفلة أولى', '+966500000003', '', 'ولية الأمر', 8, true, repeat('3', 64))$$,
  'P0001',
  'duplicate_registration',
  'same minor name and guardian mobile are rejected as a duplicate'
);

select throws_ok(
  $$select * from public.register_for_event('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'يافعة صغيرة', '+966500000004', '', 'ولية الأمر', 12, true, repeat('4', 64))$$,
  'P0001',
  'minor_registration_invalid',
  'youth registration rejects age 12'
);

select is(
  (
    select registration_status
    from public.register_for_event(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
      'يافعة مسجلة', '+966500000004', '', 'ولية الأمر', 13, true,
      repeat('5', 64)
    )
  ),
  'registered',
  'youth registration accepts age 13 with guardian consent'
);

select throws_ok(
  $$select * from public.register_for_event('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', 'تسجيل مرفوض', '+966500000005', '', null, null, false, repeat('6', 64))$$,
  'P0001',
  'event_unavailable',
  'closed registration rejects new reservations instead of waitlisting them'
);

reset role;

select is(
  (
    select price_halalas_at_booking
    from public.registrations
    where phone_e164 = '+966500000001'
  ),
  5000,
  'registration retains the displayed event price'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::integer from public.registrations),
  0,
  'non-admin cannot read registration rows'
);

select throws_ok(
  $$select public.cancel_registration('00000000-0000-4000-8000-000000000000')$$,
  '42501',
  'admin_required',
  'non-admin cannot cancel a registration'
);

select throws_ok(
  $$select public.invite_waitlisted_registration('00000000-0000-4000-8000-000000000000', repeat('7', 64))$$,
  '42501',
  'admin_required',
  'non-admin cannot create a waitlist invitation'
);

select throws_ok(
  $$select public.record_registration_check_in('00000000-0000-4000-8000-000000000000', 'checked_in')$$,
  '42501',
  'admin_required',
  'non-admin cannot record a check-in outcome'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::integer from public.registrations),
  7,
  'approved admin sees all registration rows'
);

select lives_ok(
  $$select public.record_registration_check_in((select id from public.registrations where phone_e164 = '+966500000004'), 'checked_in')$$,
  'approved admin can record an attended check-in'
);

select is(
  (select check_in_status from public.registrations where phone_e164 = '+966500000004'),
  'checked_in',
  'check-in outcome remains separate from registration status'
);

select ok(
  (select checked_in_at is not null from public.registrations where phone_e164 = '+966500000004'),
  'attended check-in records its timestamp'
);

select lives_ok(
  $$select public.record_registration_check_in((select id from public.registrations where phone_e164 = '+966500000003' limit 1), 'absent')$$,
  'approved admin can record an absence'
);

select throws_ok(
  $$select public.record_registration_check_in((select id from public.registrations where phone_e164 = '+966500000003' limit 1), 'pending')$$,
  'P0001',
  'invalid_check_in_status',
  'check-in API rejects an administrator resetting the outcome through an unapproved value'
);

select lives_ok(
  $$select public.cancel_registration((select id from public.registrations where phone_e164 = '+966500000001'))$$,
  'approved admin can cancel a confirmed registration'
);

select is(
  (select status from public.registrations where phone_e164 = '+966500000001'),
  'cancelled',
  'admin cancellation changes the registration status'
);

select lives_ok(
  $$select public.invite_waitlisted_registration((select id from public.registrations where phone_e164 = '+966500000002'), repeat('8', 64))$$,
  'approved admin can invite a waitlisted registration'
);

select is(
  (select status from public.registrations where phone_e164 = '+966500000002'),
  'invited',
  'manual selection creates an invitation instead of direct registration'
);

select is(
  (
    select invitation_expires_at - invited_at
    from public.registrations
    where phone_e164 = '+966500000002'
  ),
  interval '6 hours',
  'waitlist invitation is valid for exactly six hours'
);

select is(
  (
    select active_reservation_count::integer
    from public.get_event_registration_states()
    where event_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
  ),
  1,
  'an unexpired invitation reserves one active seat'
);

select is(
  (
    select registration_availability
    from public.get_event_registration_states()
    where event_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
  ),
  'full',
  'availability is derived as full from active reservations'
);

select throws_ok(
  $$update public.events set capacity = 1 where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'$$,
  'P0001',
  'capacity_below_active_reservations',
  'capacity cannot be lowered below active reservations'
);

reset role;
set local role anon;

select is(
  (
    select event_title
    from public.get_waitlist_invitation(repeat('8', 64))
  ),
  'فعالية التسجيل',
  'secure invitation token exposes only its matching invitation details'
);

select lives_ok(
  $$select public.accept_waitlist_invitation(repeat('8', 64))$$,
  'guest can accept an unexpired secure invitation'
);

select is(
  (select count(*)::integer from public.get_waitlist_invitation(repeat('8', 64))),
  0,
  'accepted invitation token is invalidated'
);

select is(
  (
    select registration_status
    from public.get_booking_by_token(repeat('b', 64))
  ),
  'registered',
  'booking-management token sees the accepted booking'
);

select lives_ok(
  $$select public.confirm_booking_attendance_by_token(repeat('b', 64))$$,
  'booking-management token can confirm attendance'
);

select is(
  (
    select attendance_status
    from public.get_booking_by_token(repeat('b', 64))
  ),
  'confirmed',
  'attendance confirmation remains separate from booking status'
);

select lives_ok(
  $$select public.cancel_booking_by_token(repeat('b', 64))$$,
  'booking-management token can cancel after explicit confirmation'
);

select is(
  (select count(*)::integer from public.get_booking_by_token(repeat('b', 64))),
  0,
  'booking-management token is invalidated after cancellation'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.cancel_registration((select id from public.registrations where phone_e164 = '+966500000010'))$$,
  'admin can release the seat used by the revocation test'
);

select lives_ok(
  $$select public.invite_waitlisted_registration((select id from public.registrations where phone_e164 = '+966500000011'), repeat('9', 64))$$,
  'admin can create an invitation that may be revoked'
);

select lives_ok(
  $$select public.revoke_waitlist_invitation((select id from public.registrations where phone_e164 = '+966500000011'))$$,
  'admin can revoke an invitation before expiry'
);

select is(
  (select status from public.registrations where phone_e164 = '+966500000011'),
  'waitlisted',
  'revoked invitation returns to the waitlist'
);

select lives_ok(
  $$select public.invite_waitlisted_registration((select id from public.registrations where phone_e164 = '+966500000011'), repeat('0', 64))$$,
  'admin can issue a new invitation after revocation'
);

reset role;

update public.registrations
set
  invited_at = now() - interval '6 hours 2 seconds',
  invitation_expires_at = now() - interval '2 seconds'
where phone_e164 = '+966500000011';

select is(
  (select count(*)::integer from public.get_waitlist_invitation(repeat('0', 64))),
  0,
  'expired invitation cannot be viewed or accepted'
);

select is(
  private.expire_waitlist_invitations(),
  1,
  'expiry cleanup releases an expired invitation'
);

select is(
  (select status from public.registrations where phone_e164 = '+966500000011'),
  'waitlisted',
  'expired invitation returns to the waitlist'
);

select ok(
  not has_table_privilege('authenticated', 'public.registrations', 'DELETE'),
  'application roles have no hard-delete privilege'
);

select ok(
  not has_function_privilege('authenticated', 'private.delete_expired_registration_data()', 'EXECUTE'),
  'application roles cannot invoke personal-data cleanup directly'
);

select ok(
  not has_function_privilege('authenticated', 'private.expire_waitlist_invitations(uuid)', 'EXECUTE'),
  'application roles cannot invoke invitation expiry directly'
);

select is(
  (select count(*)::integer from cron.job where jobname = 'delete-expired-event-registration-data'),
  1,
  '90-day personal-data cleanup job is scheduled once'
);

select is(
  (select count(*)::integer from cron.job where jobname = 'expire-waitlist-invitations'),
  1,
  'waitlist invitation expiry job is scheduled once'
);

select * from finish();
rollback;
