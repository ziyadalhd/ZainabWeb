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
    <section className="home-past">
      <div className="page-shell section-space">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">لقاءات جمعتنا</p>
            <h2>فعاليات سابقة</h2>
          </div>
          <Link href="/events#past" className="home-text-link">
            عرض الفعاليات السابقة <span aria-hidden="true">←</span>
          </Link>
        </div>
        <div className="home-events__grid">
          {events.map((event) => (
            <PastEventCard key={event.id} event={event} compact />
          ))}
        </div>
      </div>
    </section>
  );
}
