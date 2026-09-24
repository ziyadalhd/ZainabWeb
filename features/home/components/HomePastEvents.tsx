import Link from "next/link";
import { PastEventCard } from "@/features/events/components/PastEventCard";
import type { PastEvent } from "@/lib/domain/types";

/** The most recent past events, newest first, as the catalog returns them. */
export function selectHomePastEvents(events: readonly PastEvent[]): readonly PastEvent[] {
  return events.slice(0, 2);
}

export function HomePastEvents({ events }: { events: readonly PastEvent[] }) {
  if (events.length === 0) return null;

  return (
    <section className="page-shell section-space pt-0">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">لقاءات جمعتنا</p>
          <h2 className="mt-4 text-3xl font-black text-[var(--brand-forest)] sm:text-4xl">فعاليات سابقة</h2>
        </div>
        <Link href="/events#past" className="button-secondary w-full sm:w-fit">عرض الفعاليات السابقة</Link>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {events.map((event) => <PastEventCard key={event.id} event={event} />)}
      </div>
    </section>
  );
}
