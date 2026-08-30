import { Suspense } from "react";
import type { Metadata } from "next";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { AdminHub } from "@/features/admin/components/AdminHub";
import { CalendarOverlay } from "@/features/admin/components/CalendarOverlay";
import { EventInspectorSkeleton } from "@/features/admin/components/EventInspectorSkeleton";
import { EventPanel } from "@/features/admin/components/EventPanel";
import { EventPanelBody } from "@/features/admin/components/EventPanelHost";
import { buildTriageItems } from "@/features/admin/attention-items";
import { buildCalendarItems } from "@/features/admin/calendar-items";
import { getCalendarMonth, monthHref } from "@/features/admin/calendar-month";
import { buildDaySummary, buildGreeting } from "@/features/admin/day-briefing";
import { buildDayPulseItems, dayHref, formatDayParam, getSelectedDay } from "@/features/admin/day-pulse";
import { listAdminEvents, listAdminRegistrations, listAdminServiceRequests } from "@/features/admin/admin-lists";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getCurrentTimestamp } from "@/lib/time/clock";
import { confirmInvitationAction, revokeInvitationAction } from "@/app/(dashboard)/admin/(protected)/registrations/actions";

const registrationActions = { confirmInvitation: confirmInvitationAction, revokeInvitation: revokeInvitationAction };

export const metadata: Metadata = { title: "اليوم" };
// Per-admin operational data read through cookie-scoped Supabase clients: never cacheable.
// `force-dynamic` already implies `revalidate = 0`; the page streams instead of caching.
export const dynamic = "force-dynamic";

interface HubSearchParams {
  day?: string;
  calendar?: string;
  month?: string;
  event?: string;
  id?: string;
}

function eventCloseHref(day: string | undefined): string {
  return day ? `/admin?day=${day}` : "/admin";
}

function HubSkeleton() {
  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.9fr)_minmax(19rem,1fr)]" aria-busy="true" aria-label="جارٍ تحميل لوحة اليوم">
      <div className="grid gap-4">
        <Skeleton className="h-6 w-40" />
        <SkeletonCard className="min-h-[6rem]" />
        <SkeletonCard className="min-h-[6rem]" />
        <SkeletonCard className="min-h-[6rem]" />
      </div>
      <div className="grid content-start gap-8">
        <Skeleton className="h-4 w-24" />
        <SkeletonCard className="min-h-[14rem]" />
        <SkeletonCard className="min-h-[9rem]" />
      </div>
    </div>
  );
}

/**
 * The hub's data half, isolated behind its own Suspense boundary so the greeting and title paint on
 * the first flush. All three lists fan out together, where the previous shape awaited the
 * registration repository on its own between two `Promise.all`s.
 */
async function HubSection({ requestedDay, now }: { requestedDay: string | undefined; now: number }) {
  const [events, registrations, requests] = await Promise.all([listAdminEvents(), listAdminRegistrations(), listAdminServiceRequests()]);

  if (!events.ok || !registrations.ok || !requests.ok) {
    return (
      <>
        <p className="mt-5 max-w-3xl text-base leading-8 muted-copy sm:text-lg">تعذر تحميل بيانات اليوم.</p>
        <LoadErrorNotice />
      </>
    );
  }

  const today = getSelectedDay(undefined, now);
  const selectedDay = getSelectedDay(requestedDay, now);
  const pulseItems = buildDayPulseItems(events.data, requests.data, selectedDay, "/admin");
  const taskCount = buildTriageItems(events.data, registrations.data, requests.data, now).length;
  const eventCount = pulseItems.filter((item) => item.isEvent).length;

  return (
    <>
      <p className="mt-5 max-w-3xl text-base leading-8 muted-copy sm:text-lg">{buildDaySummary(eventCount, taskCount)}</p>
      <AdminHub
        events={events.data}
        registrations={registrations.data}
        requests={requests.data}
        now={now}
        pulseItems={pulseItems}
        selectedDay={selectedDay}
        today={today}
        dayHrefFor={(day: Date) => dayHref("/admin", {}, day, 0)}
        calendarHref={dayHref("/admin", { calendar: "1" }, selectedDay, 0)}
        registrationActions={registrationActions}
      />
    </>
  );
}

/**
 * The calendar overlay's data half — its own boundary, so opening it never blocks the hub. The two
 * lists are the same request-scoped, `cache`d calls `HubSection` makes, so the second region costs
 * no extra queries.
 */
async function CalendarSection({ requestedDay, requestedMonth, now }: { requestedDay: string | undefined; requestedMonth: string | undefined; now: number }) {
  const [events, requests] = await Promise.all([listAdminEvents(), listAdminServiceRequests()]);
  if (!events.ok || !requests.ok) return null;

  const selectedDay = getSelectedDay(requestedDay, now);
  const month = getCalendarMonth(requestedMonth);
  const calendarHref = dayHref("/admin", { calendar: "1" }, selectedDay, 0);

  return (
    <CalendarOverlay
      closeHref={dayHref("/admin", {}, selectedDay, 0)}
      calendarItems={buildCalendarItems(events.data, requests.data, "/admin")}
      month={month}
      monthHrefPrevious={monthHref("/admin", { calendar: "1", day: formatDayParam(selectedDay) }, month, -1)}
      monthHrefNext={monthHref("/admin", { calendar: "1", day: formatDayParam(selectedDay) }, month, 1)}
      monthHrefCurrent={calendarHref}
    />
  );
}

export default async function AdminHubPage({ searchParams }: { searchParams: Promise<HubSearchParams> }) {
  const [, { day: requestedDay, calendar: calendarOpen, month: requestedMonth, event: eventId, id: selectedRegistrationId }] = await Promise.all([
    requireAdmin(),
    searchParams,
  ]);
  const now = getCurrentTimestamp();

  return (
    <main className="admin-page">
      <PageHeader eyebrow={buildGreeting(now)} title="ما يحتاج عنايتك اليوم" />
      <Suspense fallback={<HubSkeleton />}>
        <HubSection requestedDay={requestedDay} now={now} />
      </Suspense>
      {eventId ? (
        <EventPanel closeHref={eventCloseHref(requestedDay)} triggerId={`event-trigger-${eventId}`} label="مساحة الفعالية">
          <Suspense fallback={<EventInspectorSkeleton />}>
            <EventPanelBody eventId={eventId} selectedRegistrationId={selectedRegistrationId} />
          </Suspense>
        </EventPanel>
      ) : null}
      {calendarOpen ? (
        <Suspense fallback={null}>
          <CalendarSection requestedDay={requestedDay} requestedMonth={requestedMonth} now={now} />
        </Suspense>
      ) : null}
    </main>
  );
}
