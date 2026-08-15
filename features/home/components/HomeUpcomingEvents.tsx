import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventCard } from "@/features/events/components/EventCard";
import type { Event } from "@/lib/domain/types";

export function selectHomeEvents(events: readonly Event[]): readonly Event[] {
  return events.slice(0, 2);
}

export function HomeUpcomingEvents({ events }: { events: readonly Event[] }) {
  return (
    <section className="page-shell section-space">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">قريبًا في بَيْن</p>
          <h2 className="mt-4 text-3xl font-black text-[var(--brand-forest)] sm:text-4xl">الفعاليات القادمة</h2>
        </div>
        <Link href="/events" className="button-secondary w-full sm:w-fit">عرض كل الفعاليات</Link>
      </div>
      {events.length > 0 ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {events.map((event) => <EventCard key={event.id} event={event} compact />)}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="ما فيه فعاليات معلنة الآن" description="ارجعي لنا قريب، وبنشاركك كل جديد هنا." />
        </div>
      )}
    </section>
  );
}
