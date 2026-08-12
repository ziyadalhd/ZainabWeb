import Link from "next/link";
import type { Event } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatArabicEventDate, formatArabicEventTimeRange, formatArabicNumber, formatEventPrice } from "@/lib/format/date";
import { changeEventStatusAction } from "@/app/(dashboard)/admin/(protected)/events/actions";

export function EventCapacityTable({ events, compact = false }: { events: readonly Event[]; compact?: boolean }) {
  if (events.length === 0) {
    return <EmptyState title="لا توجد فعاليات بعد" description="ابدأ بإنشاء فعالية جديدة؛ ستُحفظ أولًا كمسودة." />;
  }

  return (
    <div>
      <p className="mb-2 text-xs font-bold muted-copy md:hidden">مرري الجدول أفقيًا لعرض جميع التفاصيل.</p>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="جدول الفعاليات؛ يمكن تمريره أفقيًا">
      <table className="operational-table w-full min-w-[960px] border-collapse text-right text-sm">
        <caption className="sr-only">الفعاليات والسعة وحالة النشر</caption>
        <thead>
          <tr>
            <th className="px-5 py-4">الفعالية</th>
            <th className="px-5 py-4">التاريخ والوقت</th>
            <th className="px-5 py-4">السعة</th>
            <th className="px-5 py-4">السعر</th>
            <th className="px-5 py-4">الحجوزات</th>
            <th className="px-5 py-4">التسجيل</th>
            <th className="px-5 py-4">النشر</th>
            {!compact ? <th className="px-5 py-4">الإجراءات</th> : null}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-t border-[var(--color-border)] align-top">
              <td className="px-5 py-4"><span className="block font-bold">{event.title}</span><span className="text-xs muted-copy">{event.eventTypeLabel}</span></td>
              <td className="px-5 py-4 whitespace-nowrap"><span className="block font-bold">{formatArabicEventDate(event.startsAt)}</span><span className="text-xs muted-copy">{formatArabicEventTimeRange(event.startsAt, event.endsAt)}</span></td>
              <td className="data-value px-5 py-4">{formatArabicNumber(event.activeReservationCount)} / {formatArabicNumber(event.capacity)}</td>
              <td className="px-5 py-4 whitespace-nowrap">{formatEventPrice(event.priceHalalas)}</td>
              <td className="px-5 py-4"><StatusBadge status={event.availability} /></td>
              <td className="px-5 py-4"><StatusBadge status={event.registrationStatus} /></td>
              <td className="px-5 py-4"><StatusBadge status={event.publicationStatus} /></td>
              {!compact ? (
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/events/${event.id}/edit`} className="button-quiet min-h-9 px-3 py-1.5 text-sm">تعديل</Link>
                    {event.publicationStatus === "draft" && event.endsAt !== null && event.priceHalalas !== null ? (
                      <form action={changeEventStatusAction.bind(null, event.id, "published")}><button className="button-primary min-h-9 px-3 py-1.5 text-sm" type="submit">نشر</button></form>
                    ) : null}
                    {event.publicationStatus === "draft" && (event.endsAt === null || event.priceHalalas === null) ? (
                      <span className="notice-warning inline-flex px-3 py-1.5 text-xs">أكمل البيانات للنشر</span>
                    ) : null}
                    {event.publicationStatus === "published" && (event.endsAt === null || event.priceHalalas === null) ? (
                      <span className="notice-warning inline-flex px-3 py-1.5 text-xs">بيانات النشر ناقصة</span>
                    ) : null}
                    {event.publicationStatus !== "archived" ? (
                      <form action={changeEventStatusAction.bind(null, event.id, "archived")}><button className="button-quiet min-h-9 px-3 py-1.5 text-sm" type="submit">أرشفة</button></form>
                    ) : (
                      <form action={changeEventStatusAction.bind(null, event.id, "draft")}><button className="button-secondary min-h-9 px-3 py-1.5 text-sm" type="submit">إعادة إلى مسودة</button></form>
                    )}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
