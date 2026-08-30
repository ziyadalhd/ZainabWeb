import type { Event } from "@/lib/domain/types";
import { EventCardView } from "@/features/events/components/EventCardView";
import { eventAudienceLabels, eventAvailabilityPresentation } from "@/features/events/event-presentation";

export function EventCard({ event, compact = false }: { event: Event; compact?: boolean }) {
  const availability = eventAvailabilityPresentation[event.availability];
  return (
    <EventCardView
      title={event.title}
      audienceLabel={eventAudienceLabels[event.audience]}
      eventTypeLabel={event.eventTypeLabel}
      startsAt={new Date(event.startsAt)}
      endsAt={event.endsAt ? new Date(event.endsAt) : null}
      capacity={event.capacity}
      priceHalalas={event.priceHalalas}
      posterUrl={event.posterUrl}
      statusLabel={availability.status}
      actionLabel={availability.action}
      href={`/events/${event.id}`}
      compact={compact}
    />
  );
}
