import Link from "next/link";
import { EventCard } from "@/features/events/components/EventCard";
import type { Event } from "@/lib/domain/types";

export function selectHomeEvents(events: readonly Event[]): readonly Event[] {
  return events.slice(0, 2);
}

export function HomeUpcomingEvents({ events }: { events: readonly Event[] }) {
  return (
    <section id="upcoming" className="home-events page-shell section-space">
      <div className="home-section-heading">
        <div>
          <p className="eyebrow">قريبًا في بَيْن</p>
          <h2>الفعاليات القادمة</h2>
        </div>
        <Link href="/events" className="home-text-link">
          كل الفعاليات <span aria-hidden="true">←</span>
        </Link>
      </div>
      {events.length > 0 ? (
        <div className="home-events__grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} compact />
          ))}
        </div>
      ) : (
        <div className="home-events__empty">
          <h3>لا توجد فعاليات معلنة حاليًا</h3>
          <p>تابعي فعاليات بَيْن القادمة قريبًا.</p>
          <Link href="/surveys/interested-contact" className="home-text-link mt-2">
            سجّلي اهتمامكِ بالفعاليات القادمة <span aria-hidden="true">←</span>
          </Link>
        </div>
      )}
    </section>
  );
}
