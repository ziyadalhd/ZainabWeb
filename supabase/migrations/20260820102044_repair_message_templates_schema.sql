-- Corrects environments where the original message-template migration was
-- recorded without creating the table. It is intentionally idempotent.
create table if not exists public.message_templates (
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

create unique index if not exists message_templates_global_kind_unique
  on public.message_templates (kind)
  where event_id is null;

create unique index if not exists message_templates_event_kind_unique
  on public.message_templates (event_id, kind)
  where event_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.message_templates'::regclass
      and tgname = 'message_templates_set_updated_at'
      and not tgisinternal
  ) then
    create trigger message_templates_set_updated_at
    before update on public.message_templates
    for each row
    execute function private.set_updated_at();
  end if;
end;
$$;

alter table public.message_templates enable row level security;

revoke all on table public.message_templates from public, anon, authenticated;
grant select, insert, update, delete on table public.message_templates to authenticated;

drop policy if exists message_templates_admin_access on public.message_templates;
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
)
on conflict (kind) where event_id is null do nothing;
