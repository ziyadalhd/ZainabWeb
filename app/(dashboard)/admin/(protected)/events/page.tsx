import type { Metadata } from "next";
import Link from "next/link";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventCapacityTable } from "@/features/admin/components/EventCapacityTable";
import { buildCalendarItems } from "@/features/admin/calendar-items";
import { CalendarMonthGrid } from "@/features/admin/components/CalendarMonthGrid";
import { EventPanel } from "@/features/admin/components/EventPanel";
import { EventWorkspaceContent } from "@/features/admin/components/EventWorkspaceContent";
import type { RegistrationTableActions } from "@/features/admin/components/RegistrationTable";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isEntityId } from "@/lib/domain/entity-id";
import { getRiyadhDateParts } from "@/lib/format/date";
import { createAdminEventFeedbackRepository } from "@/lib/supabase/event-feedback";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";
import { createAdminServiceRequestRepository } from "@/lib/supabase/service-requests";
import { getEventRegistrationReminderTemplate, getRegistrationReminderTemplate } from "@/lib/supabase/message-templates";
import { changeEventStatusAction } from "@/app/(dashboard)/admin/(protected)/events/actions";
import {
  cancelRegistrationAction,
  confirmAttendanceAction,
  recordCheckInAction,
  revokeInvitationAction,
  setRegistrationPaymentStatusAction,
} from "@/app/(dashboard)/admin/(protected)/registrations/actions";

export const metadata: Metadata = { title: "الفعاليات" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const registrationActions: RegistrationTableActions = {
  cancelRegistration: cancelRegistrationAction,
  confirmAttendance: confirmAttendanceAction,
  recordCheckIn: recordCheckInAction,
  revokeInvitation: revokeInvitationAction,
  setPaymentStatus: setRegistrationPaymentStatusAction,
};

type EventsView = "list" | "calendar";

function getView(value: string | undefined): EventsView {
  return value === "calendar" ? "calendar" : "list";
}

const monthPattern = /^(\d{4})-(\d{2})$/;

function getCalendarMonth(value: string | undefined): Date {
  const match = value ? monthPattern.exec(value) : null;
  if (!match) {
    const current = getRiyadhDateParts(new Date());
    return new Date(Date.UTC(current.year, current.month - 1, 15, 12));
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 2020 || year > 2100 || month < 1 || month > 12) return new Date();
  return new Date(Date.UTC(year, month - 1, 15, 12));
}

function monthHref(month: Date, offset: number): string {
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth() + offset;
  const target = new Date(Date.UTC(year, monthIndex, 15, 12));
  return `/admin/events?view=calendar&month=${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}`;
}

function listHref(view: string | undefined, month: string | undefined): string {
  const params = new URLSearchParams();
  if (view) params.set("view", view);
  if (month) params.set("month", month);
  const query = params.toString();
  return query ? `/admin/events?${query}` : "/admin/events";
}

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

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; event?: string; id?: string }>;
}) {
  await requireAdmin();
  const [{ view: requestedView, month: requestedMonth, event: eventId, id: selectedRegistrationId }, eventRepository] = await Promise.all([
    searchParams,
    createAdminEventRepository(),
  ]);
  const view = getView(requestedView);
  const events = await eventRepository.list();
  const requests = view === "calendar" ? await (await createAdminServiceRequestRepository()).list() : { ok: true as const, data: [] };
  const month = getCalendarMonth(requestedMonth);
  const closeHref = listHref(requestedView, requestedMonth);

  return (
    <main className="admin-page">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <PageHeader eyebrow="الفعاليات" title="الفعاليات والتقويم" description="أضيفي فعالية، راجعي تفاصيلها، ثم انشريها عندما تصبح جاهزة." />
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/events/new" className="button-primary">
            فعالية جديدة
          </Link>
        </div>
      </div>
      <nav aria-label="طريقة عرض الفعاليات" className="workspace-tabs mt-7">
        <Link
          href="/admin/events"
          aria-current={view === "list" ? "page" : undefined}
          className={view === "list" ? "workspace-tab workspace-tab--active" : "workspace-tab"}
        >
          قائمة
        </Link>
        <Link
          href="/admin/events?view=calendar"
          aria-current={view === "calendar" ? "page" : undefined}
          className={view === "calendar" ? "workspace-tab workspace-tab--active" : "workspace-tab"}
        >
          تقويم
        </Link>
      </nav>
      {view === "list" ? (
        events.ok ? (
          <div className="mt-6">
            <EventCapacityTable events={events.data} statusAction={changeEventStatusAction} />
          </div>
        ) : (
          <LoadErrorNotice />
        )
      ) : events.ok && requests.ok ? (
        <>
          <nav aria-label="التنقل بين أشهر التقويم" className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Link className="button-quiet" href={monthHref(month, -1)}>
              الشهر السابق
            </Link>
            <Link className="button-quiet" href={monthHref(month, 1)}>
              الشهر التالي
            </Link>
            <Link className="button-secondary col-span-2" href="/admin/events?view=calendar">
              الشهر الحالي
            </Link>
          </nav>
          <div className="mt-5">
            <CalendarMonthGrid items={buildCalendarItems(events.data, requests.data)} month={month} />
          </div>
        </>
      ) : (
        <LoadErrorNotice />
      )}
      {eventId ? <EventPanelHost eventId={eventId} selectedRegistrationId={selectedRegistrationId} closeHref={closeHref} /> : null}
    </main>
  );
}

async function EventPanelHost({
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
        <p className="mt-3 text-lg font-bold">تعذر العثور على هذه الفعالية. قد تكون حُذفت أو أن الرابط غير صحيح.</p>
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
