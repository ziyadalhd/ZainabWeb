import Link from "next/link";
import { formatArabicEventDate, formatArabicEventTimeRange, formatEventPrice, formatSeatCapacity } from "@/lib/format/date";
import { PosterFrame } from "@/components/ui/PosterFrame";

export interface EventCardViewProps {
  title: string;
  audienceLabel: string;
  eventTypeLabel: string;
  startsAt: Date | null;
  endsAt: Date | null;
  capacity: number | null;
  priceHalalas: number | null;
  posterUrl: string | null;
  statusLabel: string;
  actionLabel: string;
  /** A real event links to itself; omit for a form preview with nothing to navigate to yet. */
  href?: string;
  compact?: boolean;
}

/**
 * The guest-facing event card body, extracted so an admin can render the exact same presentation
 * as a live preview while authoring an event (see EVENTS_OVERHAUL_PLAN.md §4.4). `EventCard` is a
 * thin data wrapper over this for the public site.
 */
export function EventCardView({
  title,
  audienceLabel,
  eventTypeLabel,
  startsAt,
  endsAt,
  capacity,
  priceHalalas,
  posterUrl,
  statusLabel,
  actionLabel,
  href,
  compact = false,
}: EventCardViewProps) {
  const titleNode = href ? (
    <Link className="rounded-sm decoration-[var(--brand-amber)] decoration-2 underline-offset-4 hover:underline" href={href}>
      {title || "عنوان الفعالية"}
    </Link>
  ) : (
    title || "عنوان الفعالية"
  );

  return (
    <article className={`group grid h-full overflow-hidden rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)] ${compact ? "sm:grid-cols-[9rem_1fr]" : "sm:grid-cols-[11rem_1fr]"}`}>
      <div className="min-h-56 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] sm:min-h-full sm:border-b-0 sm:border-l">
        {posterUrl ? (
          <PosterFrame
            src={posterUrl}
            alt={`بوستر ${title}`}
            sizes={compact ? "(min-width: 640px) 144px, 100vw" : "(min-width: 640px) 176px, 100vw"}
            className="h-full min-h-56"
          />
        ) : (
          <div className="grid h-full min-h-52 place-items-center px-5 text-center text-sm font-bold text-[var(--brand-olive)]">لا يوجد بوستر للفعالية</div>
        )}
      </div>
      <div className={`flex min-w-0 flex-col ${compact ? "p-5" : "p-5 sm:p-6"}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="border-r-4 border-[var(--brand-amber)] pr-2 text-xs font-extrabold text-[var(--brand-forest)]">{audienceLabel}</span>
          <span className="text-xs font-extrabold text-[var(--brand-olive)]">{statusLabel}</span>
        </div>
        <p className="mt-5 text-xs font-bold text-[var(--brand-olive)]">{eventTypeLabel || "نوع الفعالية"}</p>
        <h2 className={`${compact ? "text-xl" : "text-2xl"} mt-1 font-black leading-tight text-[var(--brand-forest)] text-pretty`}>{titleNode}</h2>
        <dl className="mt-5 grid gap-3 border-t border-[var(--color-border)] pt-4 text-sm">
          <div className="grid gap-0.5">
            <dt className="text-xs muted-copy">الموعد</dt>
            <dd className="font-extrabold text-[var(--brand-forest)]">{startsAt ? formatArabicEventDate(startsAt) : "لم يُحدَّد الموعد بعد"}</dd>
            {startsAt ? <dd className="font-bold muted-copy">{formatArabicEventTimeRange(startsAt, endsAt)}</dd> : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs muted-copy">المقاعد</dt>
              <dd className="data-value font-bold">{capacity !== null ? formatSeatCapacity(capacity) : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs muted-copy">السعر</dt>
              <dd className="font-bold">{formatEventPrice(priceHalalas)}</dd>
            </div>
          </div>
        </dl>
        {href ? (
          <Link className="button-primary mt-6 w-full sm:mt-auto sm:w-fit" href={href} aria-label={`${actionLabel}: ${title}`}>
            {actionLabel}
            <span aria-hidden="true" className="mr-2 transition-transform group-hover:-translate-x-1">←</span>
          </Link>
        ) : (
          <span className="button-primary mt-6 w-full opacity-70 sm:mt-auto sm:w-fit" aria-hidden="true">
            {actionLabel}
          </span>
        )}
      </div>
    </article>
  );
}
