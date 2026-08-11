import type { Event, Registration } from "@/lib/domain/types";
import { StatCard } from "@/components/ui/StatCard";
import { EventCapacityTable } from "@/features/admin/components/EventCapacityTable";
import { formatArabicNumber } from "@/lib/format/date";

export function AdminOverview({ events, registrations, now }: { events: readonly Event[]; registrations: readonly Registration[]; now: number }) {
  const published = events.filter((event) => event.publicationStatus === "published").length;
  const drafts = events.filter((event) => event.publicationStatus === "draft").length;
  const registered = registrations.filter((registration) => registration.status === "registered" && new Date(registration.eventStartsAt).getTime() >= now).length;
  const waitlisted = registrations.filter((registration) => (registration.status === "waitlisted" || registration.status === "invited") && new Date(registration.eventStartsAt).getTime() >= now).length;
  const capacity = events.reduce((total, event) => total + event.capacity, 0);
  const pastRegistrations = registrations.filter((registration) => new Date(registration.eventStartsAt).getTime() < now && registration.status === "registered");
  const checkedIn = pastRegistrations.filter((registration) => registration.checkInStatus === "checked_in").length;
  const absent = pastRegistrations.filter((registration) => registration.checkInStatus === "absent").length;

  return (
    <div className="mt-8 grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="المسجلون" value={formatArabicNumber(registered)} note={`إجمالي السعة ${formatArabicNumber(capacity)}`} />
        <StatCard label="الانتظار والدعوات" value={formatArabicNumber(waitlisted)} note="الاختيار يدوي والدعوة صالحة 6 ساعات" />
        <StatCard label="الحضور المسجل" value={formatArabicNumber(checkedIn)} note={`${formatArabicNumber(absent)} مسجلة كغائبة في الفعاليات السابقة`} />
        <StatCard label="الفعاليات المنشورة" value={formatArabicNumber(published)} note="تظهر للعامة إذا كان موعدها قادمًا" />
        <StatCard label="المسودات" value={formatArabicNumber(drafts)} note="لا تظهر في الموقع العام" />
      </div>
      <EventCapacityTable events={events} compact />
    </div>
  );
}
