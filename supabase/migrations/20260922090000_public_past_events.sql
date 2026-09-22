-- Lets visitors read published events that have already ended, so the site
-- can show an archive of events that took place.
--
-- The rule the archive follows: an event is shown if and only if it is
-- published and its end time has passed. Cancelled, archived, and draft
-- events never appear. An administrator hides an event that did not really
-- take place by archiving it.
--
-- Only event rows are exposed. Registrations, feedback, and every other table
-- keep their existing administrator-only policies. Permissive policies are
-- combined with OR, so this adds to events_public_upcoming_select rather than
-- replacing it.

create policy events_public_past_select
on public.events
for select
to anon, authenticated
using (
  publication_status = 'published'
  and ends_at <= now()
);
