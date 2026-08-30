import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { EventInspector } from "@/features/admin/components/EventInspector";
import { EventPanel } from "@/features/admin/components/EventPanel";
import type { RegistrationTableActions } from "@/features/admin/components/RegistrationTable";
import { loadEventWorkspace } from "@/features/admin/event-workspace";
import { changeEventStatusAction } from "@/app/(dashboard)/admin/(protected)/events/actions";
import {
  cancelRegistrationAction,
  confirmAttendanceAction,
  confirmInvitationAction,
  recordCheckInAction,
  revokeInvitationAction,
  setRegistrationPaymentStatusAction,
} from "@/app/(dashboard)/admin/(protected)/registrations/actions";

const registrationActions: RegistrationTableActions = {
  cancelRegistration: cancelRegistrationAction,
  confirmAttendance: confirmAttendanceAction,
  confirmInvitation: confirmInvitationAction,
  recordCheckIn: recordCheckInAction,
  revokeInvitation: revokeInvitationAction,
  setPaymentStatus: setRegistrationPaymentStatusAction,
};

/**
 * The inspector's data half. Kept separate from `EventPanel` so the drawer chrome (backdrop, close
 * button, title) can render on the first flush while this streams in behind a Suspense boundary —
 * see `EventPanelBody` usage in the admin pages.
 */
export async function EventPanelBody({ eventId, selectedRegistrationId }: { eventId: string; selectedRegistrationId: string | undefined }) {
  const now = new Date().toISOString();
  const workspace = await loadEventWorkspace(eventId);

  if (workspace.status === "not-found") {
    return (
      <div className="event-inspector">
        <p className="eyebrow">مساحة الفعالية</p>
        <p className="text-lg font-normal">تعذر العثور على هذه الفعالية. قد تكون حُذفت أو أن الرابط غير صحيح.</p>
      </div>
    );
  }

  if (workspace.status === "error") {
    return <LoadErrorNotice description="تعذر تحميل تسجيلات هذه الفعالية. حدّثي الصفحة وحاولي مرة أخرى." />;
  }

  return (
    <EventInspector
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
  );
}

/** Convenience wrapper: the drawer plus its body, for callers that do not stream the two apart. */
export function EventPanelHost({
  eventId,
  selectedRegistrationId,
  closeHref,
}: {
  eventId: string;
  selectedRegistrationId: string | undefined;
  closeHref: string;
}) {
  return (
    <EventPanel closeHref={closeHref} triggerId={`event-trigger-${eventId}`} label="مساحة الفعالية">
      <EventPanelBody eventId={eventId} selectedRegistrationId={selectedRegistrationId} />
    </EventPanel>
  );
}
