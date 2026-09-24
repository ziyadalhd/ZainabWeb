begin;

set local search_path = public, extensions;
-- Run fixtures as postgres explicitly: the CLI connects to a hosted project as an unprivileged login
-- role, so neither the session role nor `reset role` can be relied on to reach the setup privileges.
set local role postgres;

select plan(4);

insert into public.events (id, title, audiences, event_type_label, starts_at, capacity)
values ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'بلا وصف', array['adults'], 'لقاء', now() + interval '7 days', 20);

select is(
  (select description from public.events where id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1'),
  null,
  'description defaults to null when the administrator leaves it empty'
);

update public.events
set description = 'أمسية قراءة مفتوحة لكل المهتمات.'
where id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1';

select is(
  (select description from public.events where id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1'),
  'أمسية قراءة مفتوحة لكل المهتمات.',
  'a description within the allowed length is stored as written'
);

select throws_ok(
  $$update public.events set description = '   ' where id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1'$$,
  '23514',
  null,
  'a blank description is rejected; emptiness is represented by null'
);

select throws_ok(
  $$update public.events set description = repeat('ا', 2001) where id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1'$$,
  '23514',
  null,
  'a description longer than 2000 characters is rejected'
);

select * from finish();
rollback;
