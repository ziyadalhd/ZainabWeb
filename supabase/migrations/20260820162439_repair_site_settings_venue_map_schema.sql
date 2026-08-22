alter table public.site_settings
add column if not exists default_venue_map_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'site_settings_default_venue_map_url_valid'
      and conrelid = 'public.site_settings'::regclass
  ) then
    alter table public.site_settings
    add constraint site_settings_default_venue_map_url_valid
    check (
      default_venue_map_url is null
      or (
        length(default_venue_map_url) <= 2048
        and default_venue_map_url ~* '^https?://[^[:space:]]+$'
      )
    );
  end if;
end;
$$;

comment on column public.site_settings.default_venue_map_url is
  'Public map destination for the club default venue. Managed by approved administrators.';
