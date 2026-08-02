import type { AdminDashboardSnapshot } from "@/lib/domain/types";
import { StatCard } from "@/components/ui/StatCard";
import { AttendanceSummary } from "@/features/admin/components/AttendanceSummary";
import { EventCapacityTable } from "@/features/admin/components/EventCapacityTable";
import { formatArabicNumber } from "@/lib/format/date";

export function AdminOverview({ snapshot }: { snapshot: AdminDashboardSnapshot }) {
  const registrations = snapshot.events.reduce((total, event) => total + event.registrationCount, 0);
  const capacity = snapshot.events.reduce((total, event) => total + event.capacity, 0);
  const fullEvents = snapshot.events.filter((event) => event.availability === "full").length;

  return (
    <div className="mt-8 grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="الفعاليات القادمة" value={formatArabicNumber(snapshot.events.length)} note="بيانات تجريبية" />
        <StatCard label="إجمالي التسجيل" value={formatArabicNumber(registrations)} note={`من سعة ${formatArabicNumber(capacity)}`} />
        <StatCard label="الفعاليات المكتملة" value={formatArabicNumber(fullEvents)} />
        <StatCard label="قائمة الانتظار" value={formatArabicNumber(snapshot.waitlistEntries.length)} note="دون ترتيب أولوية" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.65fr_1.35fr]">
        <AttendanceSummary events={snapshot.events} />
        <EventCapacityTable events={snapshot.events} />
      </div>
    </div>
  );
}
