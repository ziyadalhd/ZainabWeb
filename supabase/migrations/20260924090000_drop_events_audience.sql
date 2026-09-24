-- Step 2 of the multi-audience change (20260914090000_add_event_audiences). Step 1 kept the
-- single-value `events.audience` column and a trigger that synced it with `events.audiences`, so the
-- build deployed at the time kept working. Every deployed build since reads and writes only
-- `audiences`, so the bridge goes.

drop trigger events_sync_audiences on public.events;
drop function private.sync_event_audiences();
alter table public.events drop column audience;
