import Link from "next/link";
import type { Event } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatArabicDateTime, formatArabicNumber } from "@/lib/format/date";
import { changeEventStatusAction } from "@/app/(dashboard)/admin/(protected)/events/actions";

export function EventCapacityTable({ events, compact = false }: { events: readonly Event[]; compact?: boolean }) {
  if (events.length === 0) {
    return <EmptyState title="لا توجد فعاليات بعد" description="ابدأ بإنشاء فعالية جديدة؛ ستُحفظ أولًا كمسودة." />;
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-[var(--border)] bg-white">
      <table className="w-full min-w-[860px] border-collapse text-right text-sm">
        <caption className="sr-only">الفعاليات والسعة وحالة النشر</caption>
        <thead className="bg-[var(--surface-soft)] text-[var(--brand-green-deep)]">
          <tr>
            <th className="px-5 py-4">الفعالية</th>
            <th className="px-5 py-4">التاريخ والوقت</th>
            <th className="px-5 py-4">السعة</th>
            <th className="px-5 py-4">التوفر</th>
            <th className="px-5 py-4">النشر</th>
            {!compact ? <th className="px-5 py-4">الإجراءات</th> : null}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-t border-[var(--border)] align-top">
              <td className="px-5 py-4"><span className="block font-bold">{event.title}</span><span className="text-xs muted-copy">{event.eventTypeLabel}</span></td>
              <td className="px-5 py-4 whitespace-nowrap">{formatArabicDateTime(event.startsAt)}</td>
              <td className="px-5 py-4">{formatArabicNumber(event.capacity)}</td>
              <td className="px-5 py-4"><StatusBadge status={event.availability} /></td>
              <td className="px-5 py-4"><StatusBadge status={event.publicationStatus} /></td>
              {!compact ? (
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/events/${event.id}/edit`} className="rounded-xl border border-[var(--border)] px-3 py-1.5 font-bold hover:bg-[var(--surface-soft)]">تعديل</Link>
                    {event.publicationStatus === "draft" ? (
                      <form action={changeEventStatusAction.bind(null, event.id, "published")}><button className="rounded-xl bg-[var(--brand-green)] px-3 py-1.5 font-bold text-white" type="submit">نشر</button></form>
                    ) : null}
                    {event.publicationStatus !== "archived" ? (
                      <form action={changeEventStatusAction.bind(null, event.id, "archived")}><button className="rounded-xl border border-zinc-300 px-3 py-1.5 font-bold" type="submit">أرشفة</button></form>
                    ) : (
                      <form action={changeEventStatusAction.bind(null, event.id, "draft")}><button className="rounded-xl border border-[var(--brand-green)] px-3 py-1.5 font-bold text-[var(--brand-green)]" type="submit">إعادة إلى مسودة</button></form>
                    )}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
