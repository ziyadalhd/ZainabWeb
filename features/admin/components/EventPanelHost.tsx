import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { EventPanel } from "@/features/admin/components/EventPanel";
import { EventWorkspaceContent } from "@/features/admin/components/EventWorkspaceContent";
import type { RegistrationTableActions } from "@/features/admin/components/RegistrationTable";
import { isEntityId } from "@/lib/domain/entity-id";
import { createAdminEventFeedbackRepository } from "@/lib/supabase/event-feedback";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";
import { getEventRegistrationReminderTemplate, getRegistrationReminderTemplate } from "@/lib/supabase/message-templates";
import { changeEventStatusAction } from "@/app/(dashboard)/admin/(protected)/events/actions";
import {
  cancelRegistrationAction,
  confirmAttendanceAction,
  recordCheckInAction,
  revokeInvitationAction,
  setRegistrationPaymentStatusAction,
} from "@/app/(dashboard)/admin/(protected)/registrations/actions";

const registrationActions: RegistrationTableActions = {
  cancelRegistration: cancelRegistrationAction,
  confirmAttendance: confirmAttendanceAction,
  recordCheckIn: recordCheckInAction,
  revokeInvitation: revokeInvitationAction,
  setPaymentStatus: setRegistrationPaymentStatusAction,
};

async function loadEventWorkspace(eventId: string) {
  if (!isEntityId(eventId)) return { status: "not-found" as const };

  const [eventRepository, registrationRepository, feedbackRepository] = await Promise.all([
    createAdminEventRepository(),
    createAdminRegistrationRepository(),
    createAdminEventFeedbackRepository(),
  ]);
  const event = await eventRepository.get(eventId);
  if (!event) return { status: "not-found" as const };

  const [registrationsOutcome, feedbackOutcome, eventTemplate, globalTemplate, manualMessagesOutcome] = await Promise.all([
    registrationRepository.listForEvent(event.id),
    feedbackRepository.listSubmittedForEvent(event.id),
    getEventRegistrationReminderTemplate(event.id),
    getRegistrationReminderTemplate(),
    registrationRepository.listManualMessagesForEvent(event.id),
  ]);

  if (!registrationsOutcome.ok) return { status: "error" as const };

  const registrations = registrationsOutcome.data;
  return {
    status: "ok" as const,
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

export async function EventPanelHost({
  eventId,
  selectedRegistrationId,
  closeHref,
}: {
  eventId: string;
  selectedRegistrationId: string | undefined;
  closeHref: string;
}) {
  const now = new Date().toISOString();
  const workspace = await loadEventWorkspace(eventId);

  if (workspace.status === "not-found") {
    return (
      <EventPanel closeHref={closeHref} triggerId={`event-trigger-${eventId}`} label="فعالية غير موجودة">
        <p className="eyebrow">مساحة الفعالية</p>
        <p className="mt-3 text-lg font-normal">تعذر العثور على هذه الفعالية. قد تكون حُذفت أو أن الرابط غير صحيح.</p>
      </EventPanel>
    );
  }

  if (workspace.status === "error") {
    return (
      <EventPanel closeHref={closeHref} triggerId={`event-trigger-${eventId}`} label="تعذر تحميل الفعالية">
        <LoadErrorNotice description="تعذر تحميل تسجيلات هذه الفعالية. حدّثي الصفحة وحاولي مرة أخرى." />
      </EventPanel>
    );
  }

  return (
    <EventPanel closeHref={closeHref} triggerId={`event-trigger-${eventId}`} label={`مساحة فعالية: ${workspace.event.title}`}>
      <EventWorkspaceContent
        event={workspace.event}
        registered={workspace.registered}
        waitlist={workspace.waitlist}
        allRegistrations={workspace.allRegistrations}
        feedback={workspace.feedback}
        manualMessages={workspace.manualMessages}
        eventTemplate={workspace.eventTemplate}
        globalTemplate={workspace.globalTemplate}
        now={now}
        selectedRegistrationId={selectedRegistrationId}
        registrationActions={registrationActions}
        statusAction={changeEventStatusAction}
      />
    </EventPanel>
  );
}
