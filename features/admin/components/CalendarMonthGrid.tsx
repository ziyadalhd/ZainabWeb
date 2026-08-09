import type { Event } from "@/lib/domain/types";
import { formatArabicNumber, getRiyadhDateParts } from "@/lib/format/date";

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

  return (
    <section aria-labelledby="calendar-title" className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
      <h2 id="calendar-title" className="text-xl font-extrabold text-[var(--brand-green-deep)]">{monthFormatter.format(month)}</h2>
      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[0.68rem] font-bold muted-copy sm:text-xs">
        {weekDays.map((day) => <div key={day} className="py-2">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="التقويم الميلادي للفعاليات">
        {cells.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} aria-hidden="true" className="min-h-24 rounded-xl bg-transparent" />;
          const dayEvents = events.filter((event) => {
            const parts = getRiyadhDateParts(event.startsAt);
            return parts.year === year && parts.month === monthIndex + 1 && parts.day === day;
          });
          return (
            <div key={day} role="gridcell" className="min-h-24 rounded-xl border border-[var(--border)] p-2">
              <span className="text-xs font-extrabold text-[var(--brand-green-deep)]">{formatArabicNumber(day)}</span>
              <div className="mt-2 grid gap-1">
                {dayEvents.map((event) => (
                  <div key={event.id} className="rounded-lg bg-[#e8f0e3] px-2 py-1 text-[0.65rem] font-bold text-[var(--brand-green-deep)]">
                    <span className="block truncate">{event.title}</span>
                    <span className="text-[0.6rem] font-normal">{timeFormatter.format(new Date(event.startsAt))}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
