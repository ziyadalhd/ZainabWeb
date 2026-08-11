create function private.invalidate_registration_reminders_on_cancellation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.registration_reminders
  where registration_id = new.id;

  return new;
end;
$$;

revoke all on function private.invalidate_registration_reminders_on_cancellation()
  from public, anon, authenticated;

create trigger registrations_invalidate_reminders_after_cancellation
after update of status on public.registrations
for each row
when (new.status = 'cancelled' and old.status is distinct from new.status)
execute function private.invalidate_registration_reminders_on_cancellation();

comment on function private.invalidate_registration_reminders_on_cancellation() is
  'Immediately deletes all manual reminder token hashes whenever any cancellation path moves a registration to cancelled.';
