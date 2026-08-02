import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { CalendarMonthGrid } from "@/features/admin/components/CalendarMonthGrid";
import { demoEventCatalog } from "@/lib/demo/repositories";

export const metadata: Metadata = { title: "التقويم" };

export default async function AdminCalendarPage() {
  const events = await demoEventCatalog.listEvents();
  return (
    <main className="px-4 py-8 sm:px-8">
      <PageHeader eyebrow="لوحة الإدارة" title="التقويم" description="تقويم ميلادي عربي بتوقيت مكة وبيانات تجريبية." />
      <div className="mt-8"><CalendarMonthGrid events={events} /></div>
    </main>
  );
}
