import Link from "next/link";
import type { Event } from "@/lib/domain/types";
import { AudienceChip } from "@/features/admin/components/AudienceChip";
import { CapacityMeter } from "@/features/admin/components/CapacityMeter";
import { DeleteEventButton, type DeleteEventAction } from "@/features/admin/components/DeleteEventButton";
import { DuplicateEventButton, type DuplicateEventAction } from "@/features/admin/components/DuplicateEventButton";
import { LifecycleBadge } from "@/features/admin/components/LifecycleBadge";
import { eventLifecycle } from "@/features/admin/event-lifecycle";
import { EventStatusControl, type EventStatusAction } from "@/features/admin/components/EventStatusControl";
import { formatArabicEventDate, formatArabicEventTimeRange, formatEventPrice, isSameRiyadhDate } from "@/lib/format/date";

interface EventListCardProps {
  event: Event;
  now: Date;
  statusAction: EventStatusAction;
  duplicateAction: DuplicateEventAction;
  deleteAction: DeleteEventAction;
}

export function EventListCard({ event, now, statusAction, duplicateAction, deleteAction }: EventListCardProps) {
  const lifecycle = eventLifecycle(event, now);
  const showLiveModeLink = lifecycle === "live" || (lifecycle === "upcoming" && isSameRiyadhDate(event.startsAt, now));
  return (
    <article className="event-card">
      <div className="event-card__head">
        <div className="flex flex-wrap items-center gap-2">
          <AudienceChip audience={event.audience} />
          <LifecycleBadge lifecycle={lifecycle} />
        </div>
        <span className="event-card__when numeral">
          {formatArabicEventDate(event.startsAt)} · {formatArabicEventTimeRange(event.startsAt, event.endsAt)}
        </span>
      </div>

      <h3 className="event-card__title">
        <Link id={`event-trigger-${event.id}`} href={`/admin/events?event=${event.id}`} className="rounded-sm decoration-[var(--brand-olive)] decoration-2 underline-offset-4 hover:underline">
          {event.title}
        </Link>
      </h3>
      <p className="event-card__meta">
        {event.eventTypeLabel} · {formatEventPrice(event.priceHalalas)}
      </p>

      <CapacityMeter active={event.activeReservationCount} capacity={event.capacity} />

      <div className="event-card__actions">
        <Link href={`/admin/events?event=${event.id}`} className="button-primary min-h-9 px-3 py-1.5 text-sm">
          إدارة الفعالية
        </Link>
        <Link href={`/admin/events/${event.id}/edit`} className="button-secondary min-h-9 px-3 py-1.5 text-sm">
          تعديل
        </Link>
        <DuplicateEventButton eventId={event.id} action={duplicateAction} />
        {showLiveModeLink ? (
          <Link href={`/admin/events/${event.id}/live`} className="button-secondary min-h-9 px-3 py-1.5 text-sm">
            وضع اليوم
          </Link>
        ) : null}
        <EventStatusControl event={event} action={statusAction} />
        <DeleteEventButton
          eventId={event.id}
          eventTitle={event.title}
          attendeeCount={event.activeReservationCount}
          action={deleteAction}
        />
      </div>
    </article>
  );
}
