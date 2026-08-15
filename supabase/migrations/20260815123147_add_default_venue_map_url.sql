alter table public.site_settings
add column default_venue_map_url text;

alter table public.site_settings
add constraint site_settings_default_venue_map_url_valid
check (
  default_venue_map_url is null
  or (
    length(default_venue_map_url) <= 2048
    and default_venue_map_url ~* '^https?://[^[:space:]]+$'
  )
);

update public.site_settings
set default_venue_map_url = 'https://maps.app.goo.gl/Seti5sBZvmhaHeNe8?g_st=ic'
where id;

comment on column public.site_settings.default_venue_map_url is
  'Public map destination for the club default venue. Managed by approved administrators.';
