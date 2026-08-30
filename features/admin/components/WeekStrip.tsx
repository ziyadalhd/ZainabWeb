import Link from "next/link";
import { isSameDay, weekOf } from "@/features/admin/day-pulse";
import { formatArabicNumber } from "@/lib/format/date";

const weekdayLabels = ["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"];

export function WeekStrip({ selectedDay, today, hrefFor }: { selectedDay: Date; today: Date; hrefFor: (day: Date) => string }) {
  const week = weekOf(selectedDay);
  return (
    <nav aria-label="أيام الأسبوع" className="week-strip">
      {week.map((day, index) => {
        const isSelected = isSameDay(day, selectedDay);
        const isToday = isSameDay(day, today);
        return (
          <Link
            key={day.toISOString()}
            href={hrefFor(day)}
            aria-current={isSelected ? "date" : undefined}
            className={`week-strip__day${isSelected ? " week-strip__day--selected" : ""}${isToday ? " week-strip__day--today" : ""}`}
          >
            <span className="week-strip__label">{weekdayLabels[index]}</span>
            <span className="week-strip__number">{formatArabicNumber(day.getUTCDate())}</span>
          </Link>
        );
      })}
    </nav>
  );
}
