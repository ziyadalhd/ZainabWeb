import type { PastEvent } from "@/lib/domain/types";
import { PosterFrame } from "@/components/ui/PosterFrame";
import { formatArabicEventDate } from "@/lib/format/date";
import { formatEventAudiences, posterColumnClassName } from "@/features/events/event-presentation";

/** A record of an event that took place: no seats, price, or registration link. */
export function PastEventCard({ event }: { event: PastEvent }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)] sm:min-h-60 sm:flex-row">
      <div className={posterColumnClassName}>
        {event.posterUrl ? (
          <PosterFrame src={event.posterUrl} alt={`بوستر ${event.title}`} sizes="(min-width: 640px) 176px, 100vw" className="h-full" />
        ) : (
          <div className="grid h-full place-items-center px-5 text-center text-sm font-bold text-[var(--brand-olive)]">
            {event.eventTypeLabel}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <span className="w-fit border-r-4 border-[var(--brand-amber)] pr-2 text-xs font-extrabold text-[var(--brand-forest)]">
          {formatEventAudiences(event.audiences)}
        </span>
        <p className="mt-5 text-xs font-bold text-[var(--brand-olive)]">{event.eventTypeLabel}</p>
        <h3 className="mt-1 text-2xl font-black leading-tight text-[var(--brand-forest)] text-pretty">{event.title}</h3>
        <p className="mt-3 text-sm font-bold muted-copy">{formatArabicEventDate(event.startsAt)}</p>
        {event.description ? <p className="mt-4 line-clamp-4 border-t border-[var(--color-border)] pt-4 text-sm leading-7">{event.description}</p> : null}
      </div>
    </article>
  );
}
