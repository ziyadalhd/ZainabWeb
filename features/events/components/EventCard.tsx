import Link from "next/link";
import Image from "next/image";
import type { Event, EventAudience } from "@/lib/domain/types";
import {
  formatArabicEventDate,
  formatArabicEventTimeRange,
  formatArabicNumber,
  formatEventPrice,
} from "@/lib/format/date";
import { StatusBadge } from "@/components/ui/StatusBadge";

const audienceLabels: Record<EventAudience, string> = {
  adults: "الكبار",
  youth: "اليافعون",
  children: "الصغار",
};

export function EventCard({ event }: { event: Event }) {
  return (
    <article className="group grid h-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] sm:grid-cols-[11rem_1fr]">
      <div className="relative min-h-52 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] sm:min-h-full sm:border-b-0 sm:border-l">
        {event.posterUrl ? (
          <Image
            src={event.posterUrl}
            alt={`بوستر ${event.title}`}
            fill
            sizes="(min-width: 640px) 176px, 100vw"
            className="object-contain"
          />
        ) : (
          <div className="grid h-full min-h-52 place-items-center px-5 text-center text-sm font-bold text-[var(--brand-olive)]">لا يوجد بوستر للفعالية</div>
        )}
      </div>
      <div className="flex min-w-0 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="border-r-4 border-[var(--brand-amber)] pr-2 text-xs font-extrabold text-[var(--brand-forest)]">{audienceLabels[event.audience]}</span>
          <StatusBadge status={event.availability} />
        </div>
        <p className="mt-5 text-xs font-bold text-[var(--brand-olive)]">{event.eventTypeLabel}</p>
        <h2 className="mt-1 text-2xl font-black leading-tight text-[var(--brand-forest)] text-pretty">
          <Link className="rounded-sm decoration-[var(--brand-amber)] decoration-2 underline-offset-4 hover:underline" href={`/events/${event.id}`}>
            {event.title}
          </Link>
        </h2>
        <dl className="mt-5 grid gap-3 border-t border-[var(--color-border)] pt-4 text-sm">
          <div className="grid gap-0.5"><dt className="text-xs muted-copy">الموعد</dt><dd className="font-extrabold text-[var(--brand-forest)]">{formatArabicEventDate(event.startsAt)}</dd><dd className="font-bold muted-copy">{formatArabicEventTimeRange(event.startsAt, event.endsAt)}</dd></div>
          <div className="grid grid-cols-2 gap-3"><div><dt className="text-xs muted-copy">السعة</dt><dd className="data-value font-bold">{formatArabicNumber(event.capacity)} مقعدًا</dd></div><div><dt className="text-xs muted-copy">السعر</dt><dd className="font-bold">{formatEventPrice(event.priceHalalas)}</dd></div></div>
        </dl>
        <Link className="button-primary mt-6 w-full sm:mt-auto sm:w-fit" href={`/events/${event.id}`} aria-label={`عرض تفاصيل ${event.title}`}>
          عرض التفاصيل
          <span aria-hidden="true" className="mr-2 transition-transform group-hover:-translate-x-1">←</span>
        </Link>
      </div>
    </article>
  );
}
