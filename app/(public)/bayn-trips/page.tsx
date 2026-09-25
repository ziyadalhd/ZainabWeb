import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventList } from "@/features/events/components/EventList";
import { createEventCatalog } from "@/lib/supabase/events";

export const metadata: Metadata = {
  title: "رحلات بَيْن",
  description: "الرحلات القادمة المنشورة من نادي بَيْن الثقافي.",
};
export const dynamic = "force-dynamic";

export default async function BaynTripsPage() {
  const catalog = await createEventCatalog();
  const trips = await catalog.listUpcomingBaynTrips();
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="نادي بَيْن الثقافي" title="رحلات بَيْن" description="تجارب خارج روتينكِ، نكتشف فيها أماكن وحكايات جديدة معًا." />
      <EventList events={trips} emptyTitle="لا توجد رحلة معلنة حاليًا" emptyDescription="عودي قريبًا للاطلاع على موعد رحلة بَيْن القادمة." />
    </main>
  );
}
