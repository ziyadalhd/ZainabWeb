import Link from "next/link";
import type { Event, EventAudience } from "@/lib/domain/types";
import {
  formatArabicEventDate,
  formatArabicEventTimeRange,
  formatEventPrice,
  formatSeatCapacity,
} from "@/lib/format/date";
import { PosterFrame } from "@/components/ui/PosterFrame";
import { eventAvailabilityPresentation } from "@/features/events/event-presentation";

const audienceLabels: Record<EventAudience, string> = {
  adults: "الكبار",
  youth: "اليافعون",
  children: "الصغار",
};

export function EventCard({ event, compact = false }: { event: Event; compact?: boolean }) {
  const availability = eventAvailabilityPresentation[event.availability];
  return (
    <article className={`group grid h-full overflow-hidden rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)] ${compact ? "sm:grid-cols-[9rem_1fr]" : "sm:grid-cols-[11rem_1fr]"}`}>
      <div className="min-h-56 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] sm:min-h-full sm:border-b-0 sm:border-l">
        {event.posterUrl ? (
          <PosterFrame
            src={event.posterUrl}
            alt={`بوستر ${event.title}`}
            sizes={compact ? "(min-width: 640px) 144px, 100vw" : "(min-width: 640px) 176px, 100vw"}
            className="h-full min-h-56"
          />
        ) : (
          <div className="grid h-full min-h-52 place-items-center px-5 text-center text-sm font-bold text-[var(--brand-olive)]">لا يوجد بوستر للفعالية</div>
        )}
      </div>
      <div className={`flex min-w-0 flex-col ${compact ? "p-5" : "p-5 sm:p-6"}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="border-r-4 border-[var(--brand-amber)] pr-2 text-xs font-extrabold text-[var(--brand-forest)]">{audienceLabels[event.audience]}</span>
          <span className="text-xs font-extrabold text-[var(--brand-olive)]">{availability.status}</span>
        </div>
        <p className="mt-5 text-xs font-bold text-[var(--brand-olive)]">{event.eventTypeLabel}</p>
        <h2 className={`${compact ? "text-xl" : "text-2xl"} mt-1 font-black leading-tight text-[var(--brand-forest)] text-pretty`}>
          <Link className="rounded-sm decoration-[var(--brand-amber)] decoration-2 underline-offset-4 hover:underline" href={`/events/${event.id}`}>
            {event.title}
          </Link>
        </h2>
        <dl className="mt-5 grid gap-3 border-t border-[var(--color-border)] pt-4 text-sm">
          <div className="grid gap-0.5"><dt className="text-xs muted-copy">الموعد</dt><dd className="font-extrabold text-[var(--brand-forest)]">{formatArabicEventDate(event.startsAt)}</dd><dd className="font-bold muted-copy">{formatArabicEventTimeRange(event.startsAt, event.endsAt)}</dd></div>
          <div className="grid grid-cols-2 gap-3"><div><dt className="text-xs muted-copy">المقاعد</dt><dd className="data-value font-bold">{formatSeatCapacity(event.capacity)}</dd></div><div><dt className="text-xs muted-copy">السعر</dt><dd className="font-bold">{formatEventPrice(event.priceHalalas)}</dd></div></div>
        </dl>
        <Link className="button-primary mt-6 w-full sm:mt-auto sm:w-fit" href={`/events/${event.id}`} aria-label={`${availability.action}: ${event.title}`}>
          {availability.action}
          <span aria-hidden="true" className="mr-2 transition-transform group-hover:-translate-x-1">←</span>
        </Link>
      </div>
    </article>
  );
}
