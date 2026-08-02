import type { Event } from "@/lib/domain/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatArabicDateTime, formatArabicNumber } from "@/lib/format/date";

export function EventCapacityTable({ events }: { events: readonly Event[] }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-[var(--border)] bg-white">
      <table className="w-full min-w-[760px] border-collapse text-right text-sm">
        <caption className="sr-only">الفعاليات التجريبية والسعة والتسجيل</caption>
        <thead className="bg-[var(--surface-soft)] text-[var(--brand-green-deep)]">
          <tr>
            <th className="px-5 py-4">الفعالية</th><th className="px-5 py-4">النوع</th><th className="px-5 py-4">التاريخ والوقت</th><th className="px-5 py-4">التسجيل</th><th className="px-5 py-4">الانتظار</th><th className="px-5 py-4">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-t border-[var(--border)]">
              <td className="px-5 py-4 font-bold">{event.title}</td>
              <td className="px-5 py-4 muted-copy">{event.eventTypeLabel}</td>
              <td className="px-5 py-4 whitespace-nowrap">{formatArabicDateTime(event.startsAt)}</td>
              <td className="px-5 py-4">{formatArabicNumber(event.registrationCount)} / {formatArabicNumber(event.capacity)}</td>
              <td className="px-5 py-4">{formatArabicNumber(event.waitlistCount)}</td>
              <td className="px-5 py-4"><StatusBadge status={event.availability} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
