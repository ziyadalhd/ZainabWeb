import type { Metadata } from "next";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminHub } from "@/features/admin/components/AdminHub";
import { EventPanelHost } from "@/features/admin/components/EventPanelHost";
import { buildCalendarItems } from "@/features/admin/calendar-items";
import { getCalendarMonth, monthHref } from "@/features/admin/calendar-month";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";
import { createAdminServiceRequestRepository } from "@/lib/supabase/service-requests";
import { getCurrentTimestamp } from "@/lib/time/clock";

export const metadata: Metadata = { title: "اليوم" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function closeHref(month: string | undefined): string {
  return month ? `/admin?month=${month}` : "/admin";
}

export default async function AdminHubPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; event?: string; id?: string }>;
}) {
  await requireAdmin();
  const [{ month: requestedMonth, event: eventId, id: selectedRegistrationId }, eventRepository, requestRepository] = await Promise.all([
    searchParams,
    createAdminEventRepository(),
    createAdminServiceRequestRepository(),
  ]);
  const registrationRepository = await createAdminRegistrationRepository();
  const [events, registrations, requests] = await Promise.all([eventRepository.list(), registrationRepository.list(), requestRepository.list()]);
  const month = getCalendarMonth(requestedMonth);

  return (
    <main className="admin-page">
      <PageHeader eyebrow="لوحة الإدارة" title="اليوم" description="ابدئي بما يحتاج انتباهك الآن، ثم افتحي الفعالية أو الطلب المرتبط." />
      {events.ok && registrations.ok && requests.ok ? (
        <AdminHub
          events={events.data}
          registrations={registrations.data}
          requests={requests.data}
          now={getCurrentTimestamp()}
          calendarItems={buildCalendarItems(events.data, requests.data, "/admin")}
          month={month}
          monthHrefPrevious={monthHref("/admin", {}, month, -1)}
          monthHrefNext={monthHref("/admin", {}, month, 1)}
          monthHrefCurrent="/admin"
        />
      ) : (
        <LoadErrorNotice />
      )}
      {eventId ? (
        <EventPanelHost eventId={eventId} selectedRegistrationId={selectedRegistrationId} closeHref={closeHref(requestedMonth)} />
      ) : null}
    </main>
  );
}
