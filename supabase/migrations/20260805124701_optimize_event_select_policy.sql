drop policy events_public_upcoming_select on public.events;
drop policy events_admin_select on public.events;

create policy events_public_upcoming_select
on public.events
for select
to anon
using (
  publication_status = 'published'
  and starts_at >= now()
);

create policy events_authenticated_select
on public.events
for select
to authenticated
using (
  (
    publication_status = 'published'
    and starts_at >= now()
  )
  or (select private.is_admin())
);
