-- Allow administrators to delete an event row.
--
-- `public.events` had no delete policy and no delete grant, so deletion was impossible for every
-- role. This adds both, gated on the same `private.is_admin()` predicate (allowlisted admin with an
-- aal2/MFA session) that guards insert and update.
--
-- Attendee records stay protected by the existing foreign keys rather than by this policy:
--   public.registrations.event_id   references public.events (id) on delete restrict
--   public.event_feedback_links.event_id  references public.events (id) on delete restrict
-- so an event that anyone ever registered for, or that collected feedback, cannot be deleted even
-- by an admin — Postgres raises foreign_key_violation (SQLSTATE 23503). That matches AGENTS.md
-- §263: "Event cancellation is a retained status, not a hard delete, and notifies affected
-- registrants." Deletion is therefore only ever available for an event with no attendee history.
--
-- public.message_templates.event_id cascades, so a deleted event's per-event reminder template is
-- removed with it. That is intentional: the template is authored content belonging to the event,
-- not an attendee record.

create policy events_admin_delete
on public.events
for delete
to authenticated
using ((select private.is_admin()));

grant delete on table public.events to authenticated;
