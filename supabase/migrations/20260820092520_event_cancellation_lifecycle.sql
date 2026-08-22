alter table public.events
  drop constraint events_publication_status_valid,
  add constraint events_publication_status_valid
    check (publication_status in ('draft', 'published', 'archived', 'cancelled'));

comment on column public.events.publication_status is
  'Retained lifecycle state. Cancelled events are not public, cannot accept registrations, and are never hard deleted.';
