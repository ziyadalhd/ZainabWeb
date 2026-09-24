import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventList } from "@/features/events/components/EventList";
import { PastEventList } from "@/features/events/components/PastEventList";
import { createEventCatalog } from "@/lib/supabase/events";

export const metadata: Metadata = {
  title: "الفعاليات",
  description: "الفعاليات القادمة في نادي بَيْن الثقافي بحسب الفئة العمرية، وفعاليات أقامها النادي.",
};
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const catalog = await createEventCatalog();
  const [events, pastEvents] = await Promise.all([catalog.listUpcomingEvents(), catalog.listPastEvents()]);
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="نادي بَيْن الثقافي" title="الفعاليات" description="اختاري الفعالية اللي تناسبك، وسجّلي مكانك معنا" />
      <EventList events={events} />
      <PastEventList events={pastEvents} />
    </main>
  );
}
