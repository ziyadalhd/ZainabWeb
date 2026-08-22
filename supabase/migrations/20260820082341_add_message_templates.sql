create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  kind text not null
    constraint message_templates_kind_valid
    check (kind in ('registration_reminder')),
  event_id uuid references public.events (id) on delete cascade,
  body text not null
    constraint message_templates_body_valid
    check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.message_templates is
  'Administrator-only editable message defaults and per-event overrides. This first increment supports only manual registration reminders and contains no delivery state or recipient data.';
comment on column public.message_templates.event_id is
  'Null denotes the global default for a template kind. A non-null value is an explicit override for one event.';

create unique index message_templates_global_kind_unique
  on public.message_templates (kind)
  where event_id is null;

create unique index message_templates_event_kind_unique
  on public.message_templates (event_id, kind)
  where event_id is not null;

create trigger message_templates_set_updated_at
before update on public.message_templates
for each row
execute function private.set_updated_at();

alter table public.message_templates enable row level security;

revoke all on table public.message_templates from public, anon, authenticated;
grant select, insert, update, delete on table public.message_templates to authenticated;

create policy message_templates_admin_access
on public.message_templates
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

insert into public.message_templates (kind, event_id, body)
values (
  'registration_reminder',
  null,
  $template$
السلام عليكم {{attendee_name}}،
حياكِ في فعالية {{event_title}}.
لا تؤكدي حضورك إلا إذا كنتِ متأكدة من الحضور، لأن هناك مشاركات في قائمة الانتظار.
يمكنك تأكيد الحضور أو الاعتذار من هنا:
{{management_url}}
$template$
);
