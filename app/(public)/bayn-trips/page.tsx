import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventList } from "@/features/events/components/EventList";
import { createEventCatalog } from "@/lib/supabase/events";

export const metadata: Metadata = { title: "رحلات بَيْن" };
export const dynamic = "force-dynamic";

export default async function BaynTripsPage() {
  const catalog = await createEventCatalog();
  const trips = await catalog.listUpcomingBaynTrips();
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="نادي بَيْن الثقافي" title="رحلات بَيْن" description="الرحلات القادمة المنشورة من نادي بَيْن الثقافي." />
      <EventList events={trips} emptyTitle="لا توجد رحلات بَيْن قادمة حاليًا" emptyDescription="ستظهر هنا الرحلات القادمة بعد نشرها من إدارة النادي." />
    </main>
  );
}
