import type { Event } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventCard } from "@/features/events/components/EventCard";

export function EventList({ events }: { events: readonly Event[] }) {
  if (events.length === 0) {
    return <EmptyState title="لا توجد فعاليات قادمة حاليًا" description="ستظهر هنا الفعاليات القادمة بعد نشرها من إدارة النادي." />;
  }

  return (
    <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => <EventCard key={event.id} event={event} />)}
    </div>
  );
}
