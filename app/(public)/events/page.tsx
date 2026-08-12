import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventList } from "@/features/events/components/EventList";
import { createEventCatalog } from "@/lib/supabase/events";

export const metadata: Metadata = { title: "الفعاليات" };
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const catalog = await createEventCatalog();
  const events = await catalog.listUpcomingEvents();
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="نادي بَيْن الثقافي" title="الفعاليات" description="اختاري من الفعاليات المنشورة للكبار واليافعين والصغار." />
      <EventList events={events} />
    </main>
  );
}
