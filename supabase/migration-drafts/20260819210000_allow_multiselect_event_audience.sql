-- Migration to allow multi-select audience values (e.g. 'adults,youth')

alter table public.events drop constraint if exists events_audience_valid;
alter table public.events add constraint events_audience_valid check (length(btrim(audience)) > 0);
