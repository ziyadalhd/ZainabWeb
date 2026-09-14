-- Phase 3, step 2 of 2 (HELD AS A DRAFT ON PURPOSE).
--
-- Promote this to supabase/migrations/ and apply it ONLY after the multi-audience build is confirmed
-- live. Until then the deployed code still reads and writes `events.audience`, and dropping it here
-- would break the public site and the admin dashboard immediately.
--
-- Step 1 is supabase/migrations/20260914090000_add_event_audiences.sql.

drop trigger events_sync_audiences on public.events;

drop function private.sync_event_audiences();

alter table public.events
  drop column audience;
