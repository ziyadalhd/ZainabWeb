import Link from "next/link";
import type { CalendarItem } from "@/features/admin/calendar-items";
import { formatArabicEventDate, formatArabicNumber, formatArabicTime, getRiyadhDateParts } from "@/lib/format/date";

const weekDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const monthFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { month: "long", year: "numeric", timeZone: "Asia/Riyadh" });
const itemLabels = { event: "فعالية", request: "طلب قيد المراجعة", booking: "حجز مقبول" } as const;

function itemClassName(item: CalendarItem): string {
  if (item.conflictCount > 0) return "calendar-item calendar-item--conflict";
  if (item.kind === "event") return "calendar-item calendar-item--event";
  if (item.kind === "booking") return "calendar-item calendar-item--booking";
  return "calendar-item calendar-item--request";
}

function CalendarItemLink({ item }: { item: CalendarItem }) {
  const label = `${itemLabels[item.kind]}: ${item.title}${item.conflictCount ? `، يوجد ${formatArabicNumber(item.conflictCount)} تعارض` : ""}`;
  const capacityLabel =
    item.kind === "event" && item.capacity !== undefined && item.activeReservationCount !== undefined
      ? `${formatArabicNumber(item.activeReservationCount)}/${formatArabicNumber(item.capacity)}`
      : null;
  return (
    <Link id={item.triggerId} href={item.href} className={itemClassName(item)} aria-label={label}>
      <span className="calendar-item__kind">{capacityLabel ?? itemLabels[item.kind]}</span>
      <span className="calendar-item__title">{item.title}</span>
      <span className="calendar-item__time">
        {formatArabicTime(item.startsAt)}
        {item.endsAt ? ` – ${formatArabicTime(item.endsAt)}` : ""}
      </span>
      {item.conflictCount > 0 ? <span className="calendar-item__conflict">تعارض {formatArabicNumber(item.conflictCount)}</span> : null}
    </Link>
  );
}

export function CalendarMonthGrid({ items, month = new Date(), today = new Date() }: { items: readonly CalendarItem[]; month?: Date; today?: Date }) {
  const monthParts = getRiyadhDateParts(month);
  const year = monthParts.year;
  const monthIndex = monthParts.month - 1;
  const todayParts = getRiyadhDateParts(today);
  const isToday = (day: number) => todayParts.year === year && todayParts.month === monthIndex + 1 && todayParts.day === day;
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const firstDayOffset = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const cells = Array.from({ length: firstDayOffset + daysInMonth }, (_, index) => (index < firstDayOffset ? null : index - firstDayOffset + 1));
  const itemsByDay = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return {
      day,
      items: items.filter((item) => {
        const parts = getRiyadhDateParts(item.startsAt);
        return parts.year === year && parts.month === monthIndex + 1 && parts.day === day;
      }),
    };
  });
  const scheduledDays = itemsByDay.filter((entry) => entry.items.length > 0);
  const conflictCount = items.filter((item) => item.conflictCount > 0).length;

  return (
    <section
      aria-labelledby="calendar-title"
      className="border border-t-4 border-[var(--color-border)] border-t-[var(--brand-amber)] bg-[var(--color-surface)] p-4 shadow-raised sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--brand-olive)] pb-4">
        <div>
          <h2 id="calendar-title" className="text-2xl font-bold text-[var(--brand-forest)]">
            {monthFormatter.format(month)}
          </h2>
          <p className="mt-1 text-sm muted-copy">فعاليات وطلبات الحجز والحجوزات المقبولة في موضع واحد.</p>
        </div>
        <div className="calendar-legend" aria-label="دليل التقويم">
          <span>
            <i className="calendar-legend__event" />
            فعالية
          </span>
          <span>
            <i className="calendar-legend__request" />
            طلب
          </span>
          <span>
            <i className="calendar-legend__booking" />
            حجز مقبول
          </span>
          {conflictCount ? <span className="calendar-legend__conflict">{formatArabicNumber(conflictCount)} عناصر متعارضة</span> : null}
        </div>
      </div>
      <p className="mt-4 text-sm font-normal text-[var(--color-warning-text)]">التحذير يعني تداخلًا زمنيًا مع عنصر آخر؛ لا يغيّر حالة الطلب أو الحجز تلقائيًا.</p>
      <div className="mt-5 md:hidden">
        {scheduledDays.length === 0 ? (
          <p className="py-8 text-center muted-copy">لا توجد فعاليات أو حجوزات أو طلبات مجدولة في هذا الشهر.</p>
        ) : (
          <ol className="grid gap-3">
            {scheduledDays.map(({ day, items: dayItems }) => (
              <li
                key={day}
                className={
                  isToday(day)
                    ? "calendar-day--today border-r-4 border-[var(--brand-amber)] bg-[var(--color-surface-muted)] p-4"
                    : "border-r-4 border-[var(--brand-amber)] bg-[var(--color-surface-muted)] p-4"
                }
              >
                <p className="font-bold text-[var(--brand-forest)]">
                  {formatArabicEventDate(new Date(Date.UTC(year, monthIndex, day, 12)))}
                  {isToday(day) ? <span className="calendar-today-badge">اليوم</span> : null}
                </p>
                <div className="mt-3 grid gap-2">
                  {dayItems.map((item) => (
                    <CalendarItemLink key={item.id} item={item} />
                  ))}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="mt-5 hidden md:block">
        <div className="grid grid-cols-7 gap-px bg-[var(--color-border)] text-center text-xs font-medium text-[var(--brand-forest)]">
          {weekDays.map((day) => (
            <div key={day} className="bg-[var(--brand-cream)] py-3">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7" role="grid" aria-label="التقويم الميلادي للفعاليات والطلبات والحجوزات">
          {cells.map((day, index) => {
            if (day === null)
              return (
                <div
                  key={`empty-${index}`}
                  aria-hidden="true"
                  className="min-h-32 border-b border-l border-[var(--color-border)] bg-[var(--color-surface-muted)]/40"
                />
              );
            const dayItems = itemsByDay[day - 1]?.items ?? [];
            return (
              <div
                key={day}
                role="gridcell"
                className={
                  isToday(day)
                    ? "calendar-day--today min-h-32 min-w-0 border-b border-l border-[var(--color-border)] p-2"
                    : "min-h-32 min-w-0 border-b border-l border-[var(--color-border)] p-2"
                }
              >
                <span className={isToday(day) ? "calendar-day-number calendar-day-number--today" : "calendar-day-number"}>
                  {formatArabicNumber(day)}
                </span>
                {isToday(day) ? <span className="calendar-today-badge">اليوم</span> : null}
                <div className="mt-2 grid gap-1">
                  {dayItems.map((item) => (
                    <CalendarItemLink key={item.id} item={item} />
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
