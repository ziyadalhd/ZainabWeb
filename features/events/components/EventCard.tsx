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
    <article className="card-surface flex h-full flex-col p-6">
      {event.posterUrl ? (
        <Image
          src={event.posterUrl}
          alt={`بوستر ${event.title}`}
          width={960}
          height={540}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="mb-6 aspect-[16/9] w-full rounded-2xl object-cover"
        />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-extrabold text-[var(--brand-green)]">
          {audienceLabels[event.audience]}
        </span>
        <StatusBadge status={event.availability} />
      </div>
      <h2 className="mt-5 text-2xl font-extrabold text-[var(--brand-green-deep)]">
        <Link className="rounded-sm hover:underline" href={`/events/${event.id}`}>
          {event.title}
        </Link>
      </h2>
      <p className="mt-2 text-sm muted-copy">{event.eventTypeLabel}</p>
      <dl className="mt-6 grid gap-3 border-t border-[var(--border)] pt-5 text-sm">
        <div className="grid gap-1"><dt className="muted-copy">الموعد</dt><dd className="font-bold">{formatArabicEventDate(event.startsAt)}</dd><dd className="font-bold text-[var(--brand-green-deep)]">{formatArabicEventTimeRange(event.startsAt, event.endsAt)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="muted-copy">السعة</dt><dd className="font-bold">{formatArabicNumber(event.capacity)} مقعدًا</dd></div>
        <div className="flex justify-between gap-4"><dt className="muted-copy">السعر</dt><dd className="font-bold">{formatEventPrice(event.priceHalalas)}</dd></div>
      </dl>
      <Link
        className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--brand-green)] px-5 py-3 font-extrabold text-white transition-[background-color,transform] hover:bg-[var(--brand-green-deep)] active:translate-y-px"
        href={`/events/${event.id}`}
        aria-label={`عرض تفاصيل ${event.title}`}
      >
        عرض التفاصيل
      </Link>
    </article>
  );
}
