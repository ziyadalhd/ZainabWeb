alter table public.events
  add column ends_at timestamptz,
  add column price_halalas integer;

alter table public.events
  add constraint events_capacity_maximum
    check (capacity <= 50),
  add constraint events_end_after_start
    check (ends_at is null or ends_at > starts_at),
  add constraint events_price_non_negative
    check (price_halalas is null or price_halalas >= 0);

comment on column public.events.ends_at is
  'Event end time. Nullable only while existing phase-two rows are completed by the administrator.';

comment on column public.events.price_halalas is
  'Event price in Saudi halalas. Zero represents a free event; nullable only during the existing-row transition.';
