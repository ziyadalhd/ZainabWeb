import type { AdminEventFeedbackResponse, Event, ManualMessageRecord, Registration } from "@/lib/domain/types";
import { isEntityId } from "@/lib/domain/entity-id";
import { createAdminEventFeedbackRepository } from "@/lib/supabase/event-feedback";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";
import { getEventRegistrationReminderTemplate, getRegistrationReminderTemplate } from "@/lib/supabase/message-templates";

export interface EventWorkspaceData {
  status: "ok";
  event: Event;
  registered: readonly Registration[];
  waitlist: readonly Registration[];
  allRegistrations: readonly Registration[];
  feedback: readonly AdminEventFeedbackResponse[] | null;
  manualMessages: readonly ManualMessageRecord[] | null;
  eventTemplate: string | null;
  globalTemplate: string | null;
}

export type EventWorkspaceOutcome = EventWorkspaceData | { status: "not-found" } | { status: "error" };

/**
 * Loads everything the event inspector renders in a single fan-out.
 *
 * Every query keys off the event id from the URL, so none of them has to wait for `get(id)` to
 * resolve first — the previous "fetch the event, then fetch its five collections" shape cost an
 * extra serial round trip on the critical path of every panel open. The existence check moved to
 * the resolved result instead; the surplus queries for a missing event are wasted only on a
 * request that was going to render "not found" anyway.
 */
export async function loadEventWorkspace(eventId: string): Promise<EventWorkspaceOutcome> {
  if (!isEntityId(eventId)) return { status: "not-found" };

  const [eventRepository, registrationRepository, feedbackRepository] = await Promise.all([
    createAdminEventRepository(),
    createAdminRegistrationRepository(),
    createAdminEventFeedbackRepository(),
  ]);

  const [event, registrationsOutcome, feedbackOutcome, eventTemplate, globalTemplate, manualMessagesOutcome] = await Promise.all([
    eventRepository.get(eventId),
    registrationRepository.listForEvent(eventId),
    feedbackRepository.listSubmittedForEvent(eventId),
    getEventRegistrationReminderTemplate(eventId),
    getRegistrationReminderTemplate(),
    registrationRepository.listManualMessagesForEvent(eventId),
  ]);

  if (!event) return { status: "not-found" };
  if (!registrationsOutcome.ok) return { status: "error" };

  const registrations = registrationsOutcome.data;
  return {
    status: "ok",
    event,
    registered: registrations.filter((registration) => registration.status === "registered"),
    waitlist: registrations.filter((registration) => registration.status === "waitlisted" || registration.status === "invited"),
    allRegistrations: registrations,
    feedback: feedbackOutcome.ok ? feedbackOutcome.data : null,
    manualMessages: manualMessagesOutcome.ok ? manualMessagesOutcome.data : null,
    eventTemplate,
    globalTemplate,
  };
}
