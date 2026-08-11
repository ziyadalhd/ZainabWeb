import type { Event } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventCard } from "@/features/events/components/EventCard";

export function EventList({
  events,
  emptyTitle = "لا توجد فعاليات قادمة حاليًا",
  emptyDescription = "ستظهر هنا الفعاليات القادمة بعد نشرها من إدارة النادي.",
}: {
  events: readonly Event[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (events.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="mt-10 grid gap-5 xl:grid-cols-2">
      {events.map((event) => <EventCard key={event.id} event={event} />)}
    </div>
  );
}
