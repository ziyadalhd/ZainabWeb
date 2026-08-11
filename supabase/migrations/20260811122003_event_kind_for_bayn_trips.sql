alter table public.events
  add column event_kind text not null default 'club_event'
    constraint events_event_kind_valid
    check (event_kind in ('club_event', 'bayn_trip'));

comment on column public.events.event_kind is
  'Approved event classification. bayn_trip uses the ordinary event, registration, waitlist, and reminder workflow.';
