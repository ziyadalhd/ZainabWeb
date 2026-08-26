import type { Metadata } from "next";
import Link from "next/link";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventCapacityTable } from "@/features/admin/components/EventCapacityTable";
import { buildCalendarItems } from "@/features/admin/calendar-items";
import { CalendarMonthGrid } from "@/features/admin/components/CalendarMonthGrid";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getRiyadhDateParts } from "@/lib/format/date";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { createAdminServiceRequestRepository } from "@/lib/supabase/service-requests";
import { changeEventStatusAction } from "@/app/(dashboard)/admin/(protected)/events/actions";

export const metadata: Metadata = { title: "الفعاليات" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const successMessages: Record<string, string> = { created: "تم حفظ الفعالية كمسودة.", updated: "تم حفظ تعديلات الفعالية.", status: "تم تحديث حالة النشر." };
const errorMessages: Record<string, string> = {
  status: "تعذر تغيير حالة الفعالية. حدّث الصفحة وحاول مرة أخرى.",
  incomplete: "أكمل وقت النهاية والسعر في صفحة التعديل قبل نشر الفعالية.",
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

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ view?: string; month?: string; success?: string; error?: string; notice?: string }> }) {
  await requireAdmin();
  const [{ view: requestedView, month: requestedMonth, success, error, notice }, eventRepository] = await Promise.all([searchParams, createAdminEventRepository()]);
  const view = getView(requestedView);
  const events = await eventRepository.list();
  const requests = view === "calendar" ? await (await createAdminServiceRequestRepository()).list() : { ok: true as const, data: [] };
  const month = getCalendarMonth(requestedMonth);

  return (
    <main className="admin-page">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <PageHeader eyebrow="الفعاليات" title="الفعاليات والتقويم" description="أضيفي فعالية، راجعي تفاصيلها، ثم انشريها عندما تصبح جاهزة." />
        <div className="flex flex-wrap gap-2"><Link href="/admin/events/new" className="button-primary">فعالية جديدة</Link></div>
      </div>
      {success && successMessages[success] ? <p role="status" className="notice-success mt-6">{successMessages[success]}</p> : null}
      {error && errorMessages[error] ? <p role="alert" className="notice-error mt-6">{errorMessages[error]}</p> : null}
      {notice === "communications" ? <p className="notice-info mt-6">اختاري الفعالية، ثم افتحي تبويب «التواصل» لإدارة جميع رسائلها في مكان واحد.</p> : null}
      <nav aria-label="طريقة عرض الفعاليات" className="workspace-tabs mt-7">
        <Link href="/admin/events" aria-current={view === "list" ? "page" : undefined} className={view === "list" ? "workspace-tab workspace-tab--active" : "workspace-tab"}>قائمة</Link>
        <Link href="/admin/events?view=calendar" aria-current={view === "calendar" ? "page" : undefined} className={view === "calendar" ? "workspace-tab workspace-tab--active" : "workspace-tab"}>تقويم</Link>
      </nav>
      {view === "list" ? (
        events.ok ? <div className="mt-6"><EventCapacityTable events={events.data} statusAction={changeEventStatusAction} /></div> : <LoadErrorNotice />
      ) : (
        events.ok && requests.ok ? (
          <>
            <nav aria-label="التنقل بين أشهر التقويم" className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Link className="button-quiet" href={monthHref(month, -1)}>الشهر السابق</Link>
              <Link className="button-quiet" href={monthHref(month, 1)}>الشهر التالي</Link>
              <Link className="button-secondary col-span-2" href="/admin/events?view=calendar">الشهر الحالي</Link>
            </nav>
            <div className="mt-5"><CalendarMonthGrid items={buildCalendarItems(events.data, requests.data)} month={month} /></div>
          </>
        ) : <LoadErrorNotice />
      )}
    </main>
  );
}
