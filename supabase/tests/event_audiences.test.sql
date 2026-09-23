begin;

set local search_path = public, extensions;
-- Run fixtures as postgres explicitly: the CLI connects to a hosted project as an unprivileged login
-- role, so neither the session role nor `reset role` can be relied on to reach the setup privileges.
set local role postgres;

select plan(9);

insert into public.events (id, title, audiences, event_type_label, starts_at, ends_at, capacity, price_halalas, registration_status, publication_status)
values
  ('eeeeeeee-0000-0000-0000-000000000001', 'مختلطة', array['adults','youth'], 'لقاء', now() + interval '7 days', now() + interval '7 days 2 hours', 30, 0, 'open', 'published'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'كبار', array['adults'], 'لقاء', now() + interval '7 days', now() + interval '7 days 2 hours', 30, 0, 'open', 'published'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'فتيات', array['youth'], 'ورشة', now() + interval '7 days', now() + interval '7 days 2 hours', 30, 0, 'open', 'published'),
  ('eeeeeeee-0000-0000-0000-000000000004', 'كبار وأطفال', array['adults','children'], 'لقاء', now() + interval '7 days', now() + interval '7 days 2 hours', 30, 0, 'open', 'published');

-- Column constraints.

select throws_ok(
  $$insert into public.events (title, audiences, event_type_label, starts_at, capacity)
    values ('فارغة', array[]::text[], 'لقاء', now() + interval '7 days', 10)$$,
  '23514',
  null,
  'an event must serve at least one audience'
);

select throws_ok(
  $$insert into public.events (title, audiences, event_type_label, starts_at, capacity)
    values ('غير معروفة', array['teachers'], 'لقاء', now() + interval '7 days', 10)$$,
  '23514',
  null,
  'an audience outside the approved set is rejected'
);

-- A mixed event serves both kinds of registration.

select lives_ok(
  $$select private.register_for_event('eeeeeeee-0000-0000-0000-000000000001', 'سارة', '+966500000001', null, null, null, false, repeat('a', 64))$$,
  'an adult registers on a mixed event by supplying no age'
);

select lives_ok(
  $$select private.register_for_event('eeeeeeee-0000-0000-0000-000000000001', 'ليان', '+966500000002', null, 'أم ليان', 15, true, repeat('b', 64))$$,
  'a 15-year-old registers on the same event with a guardian'
);

select throws_ok(
  $$select private.register_for_event('eeeeeeee-0000-0000-0000-000000000001', 'ريم', '+966500000003', null, null, 15, false, repeat('c', 64))$$,
  'P0001',
  'minor_registration_invalid',
  'a minor without a guardian is refused on a mixed event'
);

select throws_ok(
  $$select private.register_for_event('eeeeeeee-0000-0000-0000-000000000004', 'جود', '+966500000004', null, 'أم جود', 15, true, repeat('d', 64))$$,
  'P0001',
  'minor_registration_invalid',
  'an age between the served bands is refused: adults + children does not cover 15'
);

-- Single-audience events keep behaving exactly as before.

select throws_ok(
  $$select private.register_for_event('eeeeeeee-0000-0000-0000-000000000002', 'نورة', '+966500000006', null, 'أم نورة', 15, true, repeat('f', 64))$$,
  'P0001',
  'invalid_registration',
  'an adults-only event still refuses a supplied age'
);

select throws_ok(
  $$select private.register_for_event('eeeeeeee-0000-0000-0000-000000000003', 'لمى', '+966500000008', null, null, null, false, repeat('2', 64))$$,
  'P0001',
  'minor_registration_invalid',
  'a youth-only event still refuses a missing age'
);

select throws_ok(
  $$select private.register_for_event('eeeeeeee-0000-0000-0000-000000000001', 'سارة', '+966500000001', null, null, null, false, repeat('3', 64))$$,
  'P0001',
  'duplicate_registration',
  'the adult duplicate rule still applies on a mixed event'
);

select * from finish();
rollback;
