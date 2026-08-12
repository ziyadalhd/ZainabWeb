import Link from "next/link";
import type { Event } from "@/lib/domain/types";
import { formatArabicEventDate, formatArabicNumber, getRiyadhDateParts } from "@/lib/format/date";

const weekDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const monthFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  month: "long",
  year: "numeric",
  timeZone: "Asia/Riyadh",
});

const timeFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Riyadh",
});

export function CalendarMonthGrid({ events, month = new Date() }: { events: readonly Event[]; month?: Date }) {
  const monthParts = getRiyadhDateParts(month);
  const year = monthParts.year;
  const monthIndex = monthParts.month - 1;
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const firstDayOffset = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const cells = Array.from({ length: firstDayOffset + daysInMonth }, (_, index) => index < firstDayOffset ? null : index - firstDayOffset + 1);
  const eventsByDay = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dayEvents = events.filter((event) => {
      const parts = getRiyadhDateParts(event.startsAt);
      return parts.year === year && parts.month === monthIndex + 1 && parts.day === day;
    });
    return { day, events: dayEvents };
  });
  const scheduledDays = eventsByDay.filter((entry) => entry.events.length > 0);

  return (
    <section aria-labelledby="calendar-title" className="border border-t-4 border-[var(--color-border)] border-t-[var(--brand-amber)] bg-[var(--color-surface)] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--brand-olive)] pb-4">
        <h2 id="calendar-title" className="text-2xl font-black text-[var(--brand-forest)]">{monthFormatter.format(month)}</h2>
        <span className="text-sm font-bold muted-copy">{formatArabicNumber(events.length)} فعالية</span>
      </div>
      <div className="mt-5 md:hidden">
        {scheduledDays.length === 0 ? <p className="py-8 text-center muted-copy">لا توجد فعاليات في هذا الشهر.</p> : (
          <ol className="grid gap-3">
            {scheduledDays.map(({ day, events: dayEvents }) => (
              <li key={day} className="border-r-4 border-[var(--brand-amber)] bg-[var(--color-surface-muted)] p-4">
                <p className="font-black text-[var(--brand-forest)]">{formatArabicEventDate(new Date(Date.UTC(year, monthIndex, day, 12)))}</p>
                <div className="mt-3 grid gap-2">
                  {dayEvents.map((event) => (
                    <Link key={event.id} href={`/admin/events/${event.id}/edit`} className="block border border-[var(--color-border)] bg-[var(--color-surface)] p-3 hover:border-[var(--brand-olive)]" aria-label={`تعديل ${event.title}`}>
                      <span className="block break-words font-extrabold">{event.title}</span>
                      <span className="data-value mt-1 block text-sm muted-copy">{timeFormatter.format(new Date(event.startsAt))} · {formatArabicNumber(event.activeReservationCount)} من {formatArabicNumber(event.capacity)} مسجلة</span>
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="mt-5 hidden md:block">
        <div className="grid grid-cols-7 gap-px bg-[var(--color-border)] text-center text-xs font-extrabold text-[var(--brand-forest)]">
          {weekDays.map((day) => <div key={day} className="bg-[var(--brand-cream)] py-3">{day}</div>)}
        </div>
        <div className="grid grid-cols-7" role="grid" aria-label="التقويم الميلادي للفعاليات">
          {cells.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} aria-hidden="true" className="min-h-28 border-b border-l border-[var(--color-border)] bg-[var(--color-surface-muted)]/40" />;
            const dayEvents = eventsByDay[day - 1]?.events ?? [];
            return (
              <div key={day} role="gridcell" className="min-h-28 min-w-0 border-b border-l border-[var(--color-border)] p-2">
                <span className="data-value text-xs font-extrabold text-[var(--brand-forest)]">{formatArabicNumber(day)}</span>
                <div className="mt-2 grid gap-1">
                  {dayEvents.map((event) => (
                    <Link key={event.id} href={`/admin/events/${event.id}/edit`} className="min-w-0 border-r-2 border-[var(--brand-amber)] bg-[var(--color-success-bg)] px-2 py-1 text-[0.68rem] font-bold text-[var(--brand-forest)] hover:bg-[var(--color-warning-bg)]" aria-label={`تعديل ${event.title}`}>
                      <span className="block truncate">{event.title}</span>
                      <span className="data-value block text-[0.62rem] font-normal">{timeFormatter.format(new Date(event.startsAt))}</span>
                      <span className="data-value mt-1 block text-[0.62rem] font-normal">{formatArabicNumber(event.activeReservationCount)} / {formatArabicNumber(event.capacity)} مسجلة</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
