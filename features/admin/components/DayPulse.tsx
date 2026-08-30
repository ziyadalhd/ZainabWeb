import Link from "next/link";
import { AudienceChip } from "@/features/admin/components/AudienceChip";
import { WeekStrip } from "@/features/admin/components/WeekStrip";
import type { PulseItem } from "@/features/admin/day-pulse";
import { formatArabicNumber } from "@/lib/format/date";

interface DayPulseProps {
  items: readonly PulseItem[];
  selectedDay: Date;
  today: Date;
  hrefFor: (day: Date) => string;
}

export function DayPulse({ items, selectedDay, today, hrefFor }: DayPulseProps) {
  return (
    <div>
      <WeekStrip selectedDay={selectedDay} today={today} hrefFor={hrefFor} />
      {items.length === 0 ? (
        <p className="mt-4 text-sm muted-copy">لا توجد فعاليات أو حجوزات مجدولة في هذا اليوم.</p>
      ) : (
        <ol className="pulse-timeline">
          {items.map((item) => (
            <li key={item.id} className="pulse-timeline__row">
              <span className="pulse-timeline__line" aria-hidden="true" />
              <span className="pulse-timeline__time">{item.timeLabel}</span>
              <span className={`pulse-timeline__dot${item.isEvent ? " pulse-timeline__dot--event" : ""}`} aria-hidden="true" />
              <Link href={item.href} className="pulse-timeline__content">
                <span className={item.isEvent ? "pulse-timeline__title pulse-timeline__title--event" : "pulse-timeline__title"}>{item.title}</span>
                <span className="pulse-timeline__meta">
                  {item.audience ? <AudienceChip audience={item.audience} /> : null}
                  {item.capacityLabel ? <span className="pulse-timeline__capacity">السعة {item.capacityLabel}</span> : null}
                  {item.conflictCount > 0 ? (
                    <span className="pulse-timeline__conflict">تعارض {formatArabicNumber(item.conflictCount)}</span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
