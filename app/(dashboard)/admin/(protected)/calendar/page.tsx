import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { CalendarMonthGrid } from "@/features/admin/components/CalendarMonthGrid";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getRiyadhDateParts } from "@/lib/format/date";
import { createAdminEventRepository } from "@/lib/supabase/events";

export const metadata: Metadata = { title: "التقويم" };
export const dynamic = "force-dynamic";

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
  return `/admin/calendar?month=${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireAdmin();
  const [{ month: requestedMonth }, repository] = await Promise.all([
    searchParams,
    createAdminEventRepository(),
  ]);
  const events = await repository.list();
  const month = getCalendarMonth(requestedMonth);

  return (
    <main className="admin-page">
      <PageHeader eyebrow="لوحة الإدارة" title="التقويم" description="تقويم ميلادي عربي يعرض الفعاليات بتوقيت السعودية." />
      <nav aria-label="التنقل بين أشهر التقويم" className="mt-8 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Link className="button-quiet" href={monthHref(month, -1)}>الشهر السابق</Link>
        <Link className="button-quiet" href={monthHref(month, 1)}>الشهر التالي</Link>
        <Link className="button-secondary col-span-2" href="/admin/calendar">الشهر الحالي</Link>
      </nav>
      <div className="mt-5"><CalendarMonthGrid events={events} month={month} /></div>
    </main>
  );
}
