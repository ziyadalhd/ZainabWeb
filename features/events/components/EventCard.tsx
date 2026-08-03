import type { Event, EventAudience } from "@/lib/domain/types";
import { formatArabicDateTime, formatArabicNumber } from "@/lib/format/date";
import { StatusBadge } from "@/components/ui/StatusBadge";

const audienceLabels: Record<EventAudience, string> = {
  adults: "الكبار",
  youth: "اليافعون",
  children: "الصغار",
};

export function EventCard({ event }: { event: Event }) {
  return (
    <article className="card-surface flex h-full flex-col p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-extrabold text-[var(--brand-green)]">
          {audienceLabels[event.audience]}
        </span>
        <StatusBadge status={event.availability} />
      </div>
      <h2 className="mt-5 text-2xl font-extrabold text-[var(--brand-green-deep)]">{event.title}</h2>
      <p className="mt-2 text-sm muted-copy">{event.eventTypeLabel}</p>
      <dl className="mt-6 grid gap-3 border-t border-[var(--border)] pt-5 text-sm">
        <div className="flex justify-between gap-4"><dt className="muted-copy">التاريخ والوقت</dt><dd className="font-bold">{formatArabicDateTime(event.startsAt)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="muted-copy">السعة</dt><dd className="font-bold">{formatArabicNumber(event.capacity)} مقعدًا</dd></div>
      </dl>
    </article>
  );
}
