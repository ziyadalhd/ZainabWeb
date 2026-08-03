create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null constraint events_title_not_blank check (length(btrim(title)) > 0),
  audience text not null constraint events_audience_valid check (audience in ('adults', 'youth', 'children')),
  event_type_label text not null constraint events_type_label_not_blank check (length(btrim(event_type_label)) > 0),
  starts_at timestamptz not null,
  capacity integer not null constraint events_capacity_positive check (capacity > 0),
  availability text not null default 'available' constraint events_availability_valid check (availability in ('available', 'full')),
  publication_status text not null default 'draft' constraint events_publication_status_valid check (publication_status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.events is 'Club events managed by approved administrators. Public access is limited by RLS to upcoming published rows.';
comment on column public.events.availability is 'Manual administrator decision; it is not inferred from capacity.';

create index events_published_starts_at_idx
  on public.events (starts_at)
  where publication_status = 'published';

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is 'Allowlist of Auth users permitted to administer club events.';

alter table public.events enable row level security;
alter table public.admin_users enable row level security;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.admin_users
      where user_id = (select auth.uid())
    );
$$;

revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger events_set_updated_at
before update on public.events
for each row
execute function private.set_updated_at();

create policy events_public_upcoming_select
on public.events
for select
to anon, authenticated
using (
  publication_status = 'published'
  and starts_at >= now()
);

create policy events_admin_select
on public.events
for select
to authenticated
using ((select private.is_admin()));

create policy events_admin_insert
on public.events
for insert
to authenticated
with check ((select private.is_admin()));

create policy events_admin_update
on public.events
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

revoke all on table public.events from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on table public.events to anon, authenticated;
grant insert, update on table public.events to authenticated;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

create policy admin_users_self_select
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));
