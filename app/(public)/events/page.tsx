import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventList } from "@/features/events/components/EventList";
import { demoEventCatalog } from "@/lib/demo/repositories";

export const metadata: Metadata = { title: "الفعاليات" };

export default async function EventsPage() {
  const events = await demoEventCatalog.listEvents();
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="بيانات تجريبية للعرض فقط" title="الفعاليات" description="فعاليات موزعة على فئات الكبار واليافعين والصغار دون تصنيف عمري تلقائي." />
      <EventList events={events} />
    </main>
  );
}
