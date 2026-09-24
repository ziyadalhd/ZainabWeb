import type { PastEvent } from "@/lib/domain/types";
import { PastEventCard } from "@/features/events/components/PastEventCard";

/** The archive section under the upcoming events. Renders nothing until an event has ended. */
export function PastEventList({ events }: { events: readonly PastEvent[] }) {
  if (events.length === 0) return null;

  return (
    <section id="past" aria-labelledby="past-events-title" className="mt-16 scroll-mt-24">
      <p className="eyebrow">لقاءات جمعتنا</p>
      <h2 id="past-events-title" className="mt-4 text-3xl font-black text-[var(--brand-forest)] sm:text-4xl">فعاليات سابقة</h2>
      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        {events.map((event) => <PastEventCard key={event.id} event={event} />)}
      </div>
    </section>
  );
}
