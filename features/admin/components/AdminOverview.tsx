import type { Event } from "@/lib/domain/types";
import { StatCard } from "@/components/ui/StatCard";
import { EventCapacityTable } from "@/features/admin/components/EventCapacityTable";
import { formatArabicNumber } from "@/lib/format/date";

export function AdminOverview({ events }: { events: readonly Event[] }) {
  const published = events.filter((event) => event.publicationStatus === "published").length;
  const drafts = events.filter((event) => event.publicationStatus === "draft").length;
  const archived = events.filter((event) => event.publicationStatus === "archived").length;
  const capacity = events.reduce((total, event) => total + event.capacity, 0);

  return (
    <div className="mt-8 grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="كل الفعاليات" value={formatArabicNumber(events.length)} note={`إجمالي السعة ${formatArabicNumber(capacity)}`} />
        <StatCard label="الفعاليات المنشورة" value={formatArabicNumber(published)} note="تظهر للعامة إذا كان موعدها قادمًا" />
        <StatCard label="المسودات" value={formatArabicNumber(drafts)} note="لا تظهر في الموقع العام" />
        <StatCard label="المؤرشفة" value={formatArabicNumber(archived)} note="يمكن إعادتها إلى مسودة" />
      </div>
      <EventCapacityTable events={events} compact />
    </div>
  );
}
