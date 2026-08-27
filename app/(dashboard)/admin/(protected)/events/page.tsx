import type { Metadata } from "next";
import Link from "next/link";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventCapacityTable } from "@/features/admin/components/EventCapacityTable";
import { buildCalendarItems } from "@/features/admin/calendar-items";
import { CalendarMonthGrid } from "@/features/admin/components/CalendarMonthGrid";
import { EventPanelHost } from "@/features/admin/components/EventPanelHost";
import { getCalendarMonth, monthHref } from "@/features/admin/calendar-month";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { createAdminServiceRequestRepository } from "@/lib/supabase/service-requests";
import { changeEventStatusAction } from "@/app/(dashboard)/admin/(protected)/events/actions";

export const metadata: Metadata = { title: "الفعاليات" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

type EventsView = "list" | "calendar";

function getView(value: string | undefined): EventsView {
  return value === "calendar" ? "calendar" : "list";
}

function listHref(view: string | undefined, month: string | undefined): string {
  const params = new URLSearchParams();
  if (view) params.set("view", view);
  if (month) params.set("month", month);
  const query = params.toString();
  return query ? `/admin/events?${query}` : "/admin/events";
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
