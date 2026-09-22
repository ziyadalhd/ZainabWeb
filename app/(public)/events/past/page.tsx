import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PastEventCard } from "@/features/events/components/PastEventCard";
import { createEventCatalog } from "@/lib/supabase/events";

export const metadata: Metadata = {
  title: "فعاليات سابقة",
  description: "فعاليات أقامها نادي بَيْن الثقافي.",
};
export const dynamic = "force-dynamic";

export default async function PastEventsPage() {
  const catalog = await createEventCatalog();
  const events = await catalog.listPastEvents();
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="نادي بَيْن الثقافي" title="فعاليات سابقة" description="لقاءات جمعتنا، وحكايات بدأت هنا" />
      {events.length === 0 ? (
        <EmptyState title="ما فيه فعاليات سابقة بعد" description="أول فعالية تنتهي راح تظهر هنا." />
      ) : (
        <div className="mt-10 grid gap-5 xl:grid-cols-2">
          {events.map((event) => (
            <PastEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
      <p className="mt-10">
        <Link href="/events" className="button-secondary">
          الفعاليات القادمة
        </Link>
      </p>
    </main>
  );
}
