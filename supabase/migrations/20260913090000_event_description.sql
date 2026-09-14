-- Optional administrator-authored description shown on the public event detail page.

alter table public.events
  add column description text;

alter table public.events
  add constraint events_description_length
    check (description is null or length(btrim(description)) between 1 and 2000);

comment on column public.events.description is
  'Optional Arabic description shown on the public event detail page. Null when the administrator left it empty.';
