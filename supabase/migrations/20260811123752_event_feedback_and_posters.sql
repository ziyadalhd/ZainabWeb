alter table public.events
  add column poster_path text
    constraint events_poster_path_valid
    check (
      poster_path is null
      or poster_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[a-f0-9-]+\.(png|jpe?g|webp)$'
    );

comment on column public.events.poster_path is
  'Path of the optional public event poster in the event-posters Storage bucket.';

insert into storage.buckets (id, name, public, allowed_mime_types)
values (
  'event-posters',
  'event-posters',
  true,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "event posters admin insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-posters'
  and (select private.is_admin())
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
);

create policy "event posters admin delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-posters'
  and (select private.is_admin())
);

create table public.event_feedback_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete restrict,
  registration_id uuid references public.registrations (id) on delete set null,
  feedback_token_hash text not null unique
    constraint event_feedback_links_token_hash_valid
    check (feedback_token_hash ~ '^[a-f0-9]{64}$'),
  hospitality_rating smallint,
  material_rating smallint,
  suggestions text,
  identity_visible boolean,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint event_feedback_links_ratings_valid
    check (
      (hospitality_rating is null or hospitality_rating between 1 and 5)
      and (material_rating is null or material_rating between 1 and 5)
    ),
  constraint event_feedback_links_suggestions_valid
    check (suggestions is null or length(suggestions) <= 4000),
  constraint event_feedback_links_submission_shape
    check (
      (
        submitted_at is null
        and hospitality_rating is null
        and material_rating is null
        and suggestions is null
        and identity_visible is null
      )
      or (
        submitted_at is not null
        and hospitality_rating between 1 and 5
        and material_rating between 1 and 5
        and identity_visible is not null
      )
    )
);

comment on table public.event_feedback_links is
  'One-use secure links and approved responses for event feedback. Anonymous submissions sever the registration reference before administrators view results.';
comment on column public.event_feedback_links.identity_visible is
  'Whether the participant chose to show her identity with this response.';

create unique index event_feedback_one_open_link_per_registration_idx
  on public.event_feedback_links (registration_id)
  where registration_id is not null and submitted_at is null;
create index event_feedback_links_event_submitted_idx
  on public.event_feedback_links (event_id, submitted_at desc);

alter table public.event_feedback_links enable row level security;

revoke all on table public.event_feedback_links from public, anon, authenticated;
grant select on table public.event_feedback_links to authenticated;

create policy event_feedback_links_admin_select
on public.event_feedback_links
for select
to authenticated
using ((select private.is_admin()));

create or replace function private.issue_event_feedback_link(
  p_registration_id uuid,
  p_feedback_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_event_id uuid;
  link_id uuid;
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  if p_feedback_token_hash !~ '^[a-f0-9]{64}$' then
    raise sqlstate 'P0001' using message = 'invalid_feedback_link';
  end if;

  select event_id
  into selected_event_id
  from public.registrations
  where id = p_registration_id
    and status = 'registered';

  if not found then
    raise sqlstate 'P0001' using message = 'registration_not_active';
  end if;

  update public.event_feedback_links
  set feedback_token_hash = p_feedback_token_hash,
      created_at = now()
  where registration_id = p_registration_id
    and submitted_at is null
  returning id into link_id;

  if found then
    return link_id;
  end if;

  insert into public.event_feedback_links (
    event_id,
    registration_id,
    feedback_token_hash
  )
  values (
    selected_event_id,
    p_registration_id,
    p_feedback_token_hash
  )
  returning id into link_id;

  return link_id;
end;
$$;

create or replace function private.get_event_feedback_by_token(
  p_feedback_token_hash text
)
returns table (event_title text)
language sql
stable
security definer
set search_path = ''
as $$
  select events.title
  from public.event_feedback_links as feedback_links
  join public.events on events.id = feedback_links.event_id
  where feedback_links.feedback_token_hash = p_feedback_token_hash
    and feedback_links.submitted_at is null;
$$;

create or replace function private.submit_event_feedback_by_token(
  p_feedback_token_hash text,
  p_hospitality_rating smallint,
  p_material_rating smallint,
  p_suggestions text,
  p_identity_visible boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_suggestions text := nullif(btrim(coalesce(p_suggestions, '')), '');
begin
  if p_feedback_token_hash !~ '^[a-f0-9]{64}$'
    or p_hospitality_rating not between 1 and 5
    or p_material_rating not between 1 and 5
    or p_identity_visible is null
    or (normalized_suggestions is not null and length(normalized_suggestions) > 4000)
  then
    raise sqlstate 'P0001' using message = 'invalid_event_feedback';
  end if;

  update public.event_feedback_links
  set hospitality_rating = p_hospitality_rating,
      material_rating = p_material_rating,
      suggestions = normalized_suggestions,
      identity_visible = p_identity_visible,
      registration_id = case when p_identity_visible then registration_id else null end,
      submitted_at = now()
  where feedback_token_hash = p_feedback_token_hash
    and submitted_at is null;

  if not found then
    raise sqlstate 'P0001' using message = 'event_feedback_unavailable';
  end if;
end;
$$;

revoke all on function private.issue_event_feedback_link(uuid, text) from public, anon, authenticated;
revoke all on function private.get_event_feedback_by_token(text) from public, anon, authenticated;
revoke all on function private.submit_event_feedback_by_token(text, smallint, smallint, text, boolean) from public, anon, authenticated;

grant usage on schema private to anon, authenticated;
grant execute on function private.issue_event_feedback_link(uuid, text) to authenticated;
grant execute on function private.get_event_feedback_by_token(text) to anon, authenticated;
grant execute on function private.submit_event_feedback_by_token(text, smallint, smallint, text, boolean) to anon, authenticated;

create function public.issue_event_feedback_link(
  p_registration_id uuid,
  p_feedback_token_hash text
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.issue_event_feedback_link(p_registration_id, p_feedback_token_hash);
$$;

create function public.get_event_feedback_by_token(
  p_feedback_token_hash text
)
returns table (event_title text)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.get_event_feedback_by_token(p_feedback_token_hash);
$$;

create function public.submit_event_feedback_by_token(
  p_feedback_token_hash text,
  p_hospitality_rating smallint,
  p_material_rating smallint,
  p_suggestions text,
  p_identity_visible boolean
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.submit_event_feedback_by_token(
    p_feedback_token_hash,
    p_hospitality_rating,
    p_material_rating,
    p_suggestions,
    p_identity_visible
  );
$$;

revoke all on function public.issue_event_feedback_link(uuid, text) from public, anon, authenticated;
revoke all on function public.get_event_feedback_by_token(text) from public, anon, authenticated;
revoke all on function public.submit_event_feedback_by_token(text, smallint, smallint, text, boolean) from public, anon, authenticated;

grant execute on function public.issue_event_feedback_link(uuid, text) to authenticated;
grant execute on function public.get_event_feedback_by_token(text) to anon, authenticated;
grant execute on function public.submit_event_feedback_by_token(text, smallint, smallint, text, boolean) to anon, authenticated;
