create table public.site_settings (
  id boolean primary key default true
    constraint site_settings_singleton check (id),
  club_introduction text,
  name_story text,
  objectives text,
  contact_phone text,
  default_venue_name text,
  default_venue_address text,
  instagram_url text,
  tiktok_url text,
  literary_partner_title text,
  literary_partner_body text,
  updated_at timestamptz not null default now(),
  constraint site_settings_copy_length_valid check (
    (club_introduction is null or length(club_introduction) <= 4000)
    and (name_story is null or length(name_story) <= 4000)
    and (objectives is null or length(objectives) <= 4000)
    and (literary_partner_body is null or length(literary_partner_body) <= 4000)
  ),
  constraint site_settings_short_text_valid check (
    (contact_phone is null or contact_phone ~ '^05[0-9]{8}$')
    and (default_venue_name is null or length(default_venue_name) <= 250)
    and (default_venue_address is null or length(default_venue_address) <= 500)
    and (literary_partner_title is null or length(literary_partner_title) <= 250)
  ),
  constraint site_settings_social_urls_valid check (
    (instagram_url is null or instagram_url ~* '^https?://[^[:space:]]+$')
    and (tiktok_url is null or tiktok_url ~* '^https?://[^[:space:]]+$')
  )
);

comment on table public.site_settings is
  'Public club copy, contact details, venue, social links, and literary-partner content managed by approved administrators.';

insert into public.site_settings (id, contact_phone)
values (true, '0537918640');

alter table public.site_settings enable row level security;

revoke all on table public.site_settings from public, anon, authenticated;
grant select on table public.site_settings to anon, authenticated;
grant insert, update on table public.site_settings to authenticated;

create policy site_settings_public_select
on public.site_settings
for select
to anon, authenticated
using (true);

create policy site_settings_admin_insert
on public.site_settings
for insert
to authenticated
with check ((select private.is_admin()));

create policy site_settings_admin_update
on public.site_settings
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row
execute function private.set_updated_at();
