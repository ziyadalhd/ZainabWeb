-- Merges the events SELECT policies into one per role. Permissive policies are
-- combined with OR, so the visibility rule is unchanged: a visitor sees an
-- event if it is published and either has not started yet or has already
-- ended. An administrator at aal2 sees every event.
--
-- Before this, anon and authenticated each had two permissive SELECT policies
-- (the upcoming one and events_public_past_select), and every read evaluated
-- both (performance advisor: multiple_permissive_policies).

drop policy events_public_upcoming_select on public.events;
drop policy events_authenticated_select on public.events;
drop policy events_public_past_select on public.events;

create policy events_public_select
on public.events
for select
to anon
using (
  publication_status = 'published'
  and (starts_at >= now() or ends_at <= now())
);

create policy events_authenticated_select
on public.events
for select
to authenticated
using (
  (
    publication_status = 'published'
    and (starts_at >= now() or ends_at <= now())
  )
  or (select private.is_admin())
);
