import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { EventFilterBar } from "@/features/admin/components/EventFilterBar";
import { EventListCard } from "@/features/admin/components/EventListCard";
import { buildCalendarItems } from "@/features/admin/calendar-items";
import { CalendarMonthGrid } from "@/features/admin/components/CalendarMonthGrid";
import { EventInspectorSkeleton } from "@/features/admin/components/EventInspectorSkeleton";
import { EventPanel } from "@/features/admin/components/EventPanel";
import { EventPanelBody } from "@/features/admin/components/EventPanelHost";
import { getCalendarMonth, monthHref } from "@/features/admin/calendar-month";
import {
  countEventsByStatus,
  filterEvents,
  parseEventAudienceFilter,
  parseEventStatusFilter,
  type EventAudienceFilter,
  type EventStatusFilter,
} from "@/features/admin/event-filters";
import { listAdminEvents, listAdminServiceRequests } from "@/features/admin/admin-lists";
import { requireAdmin } from "@/lib/auth/require-admin";
import { changeEventStatusAction, deleteEventAction, duplicateEventAction } from "@/app/(dashboard)/admin/(protected)/events/actions";

export const metadata: Metadata = { title: "الفعاليات" };
// Per-admin operational data read through cookie-scoped Supabase clients: never cacheable.
// `force-dynamic` already implies `revalidate = 0`; the page streams instead of caching.
export const dynamic = "force-dynamic";

type EventsView = "list" | "calendar";

interface EventsSearchParams {
  view?: string;
  month?: string;
  event?: string;
  id?: string;
  status?: string;
  audience?: string;
  q?: string;
}

function getView(value: string | undefined): EventsView {
  return value === "calendar" ? "calendar" : "list";
}

function closeHref(searchParams: EventsSearchParams): string {
  const params = new URLSearchParams();
  if (searchParams.view) params.set("view", searchParams.view);
  if (searchParams.month) params.set("month", searchParams.month);
  if (searchParams.status) params.set("status", searchParams.status);
  if (searchParams.audience) params.set("audience", searchParams.audience);
  if (searchParams.q) params.set("q", searchParams.q);
  const query = params.toString();
  return query ? `/admin/events?${query}` : "/admin/events";
}

const emptyStateByStatus: Record<EventStatusFilter, string> = {
  all: "لا توجد فعاليات بعد. ابدئي بإنشاء فعالية جديدة؛ ستُحفظ أولًا كمسودة حتى تراجعيها.",
  upcoming: "لا توجد فعاليات قادمة حاليًا.",
  live: "لا توجد فعالية مباشرة الآن.",
  draft: "لا توجد مسودات محفوظة حاليًا.",
  past: "لا توجد فعاليات منتهية بعد.",
  archived: "لا توجد فعاليات مؤرشفة.",
};

function EventsBodySkeleton() {
  return (
    <div className="mt-6 grid gap-4" aria-busy="true" aria-label="جارٍ تحميل الفعاليات">
      <Skeleton className="h-11 w-full max-w-2xl" />
      <SkeletonCard className="min-h-[8rem]" />
      <SkeletonCard className="min-h-[8rem]" />
      <SkeletonCard className="min-h-[8rem]" />
    </div>
  );
}

/**
 * The list/calendar body, isolated behind its own Suspense boundary so the page header and the
 * view tabs paint on the first flush. Both lists resolve in parallel; the previous shape awaited
 * the event list, then created the service-request repository, then awaited its list — three
 * serial hops for a page that needs one.
 */
async function EventsBody({ searchParams }: { searchParams: EventsSearchParams }) {
  const view = getView(searchParams.view);
  const [events, requests] = await Promise.all([listAdminEvents(), listAdminServiceRequests()]);
  const now = new Date();

  if (!events.ok || (view === "calendar" && !requests.ok)) return <LoadErrorNotice />;

  if (view === "calendar") {
    const month = getCalendarMonth(searchParams.month);
    return (
      <>
        <nav aria-label="التنقل بين أشهر التقويم" className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Link className="button-quiet" href={monthHref("/admin/events", { view: "calendar" }, month, -1)}>
            الشهر السابق
          </Link>
          <Link className="button-quiet" href={monthHref("/admin/events", { view: "calendar" }, month, 1)}>
            الشهر التالي
          </Link>
          <Link className="button-secondary col-span-2" href="/admin/events?view=calendar">
            الشهر الحالي
          </Link>
        </nav>
        <div className="mt-5">
          <CalendarMonthGrid items={buildCalendarItems(events.data, requests.ok ? requests.data : [])} month={month} />
        </div>
      </>
    );
  }

  const status = parseEventStatusFilter(searchParams.status);
  const audience = parseEventAudienceFilter(searchParams.audience);
  const query = searchParams.q ?? "";

  function buildHref(overrides: { status?: EventStatusFilter; audience?: EventAudienceFilter }): string {
    const params = new URLSearchParams();
    params.set("status", overrides.status ?? status);
    params.set("audience", overrides.audience ?? audience);
    if (query) params.set("q", query);
    return `/admin/events?${params.toString()}`;
  }

  const filtered = filterEvents(events.data, { status, audience, query, now });

  return (
    <>
      <EventFilterBar
        status={status}
        audience={audience}
        query={query}
        counts={countEventsByStatus(events.data, now)}
        buildHref={buildHref}
        searchAction="/admin/events"
      />
      {filtered.length > 0 ? (
        <div className="event-list mt-6">
          {filtered.map((event) => (
            <EventListCard
              key={event.id}
              event={event}
              now={now}
              statusAction={changeEventStatusAction}
              duplicateAction={duplicateEventAction}
              deleteAction={deleteEventAction}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="لا توجد فعاليات مطابقة" description={emptyStateByStatus[status]} />
      )}
    </>
  );
}

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<EventsSearchParams> }) {
  const [, resolvedSearchParams] = await Promise.all([requireAdmin(), searchParams]);
  const { event: eventId, id: selectedRegistrationId } = resolvedSearchParams;
  const view = getView(resolvedSearchParams.view);

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
      <Suspense key={`${view}:${resolvedSearchParams.status ?? ""}:${resolvedSearchParams.audience ?? ""}:${resolvedSearchParams.q ?? ""}:${resolvedSearchParams.month ?? ""}`} fallback={<EventsBodySkeleton />}>
        <EventsBody searchParams={resolvedSearchParams} />
      </Suspense>
      {eventId ? (
        <EventPanel closeHref={closeHref(resolvedSearchParams)} triggerId={`event-trigger-${eventId}`} label="مساحة الفعالية">
          <Suspense fallback={<EventInspectorSkeleton />}>
            <EventPanelBody eventId={eventId} selectedRegistrationId={selectedRegistrationId} />
          </Suspense>
        </EventPanel>
      ) : null}
    </main>
  );
}
