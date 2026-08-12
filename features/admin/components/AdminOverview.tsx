import type { Event, Registration } from "@/lib/domain/types";
import { StatCard } from "@/components/ui/StatCard";
import { EventCapacityTable } from "@/features/admin/components/EventCapacityTable";
import { formatArabicNumber, formatSeatCapacity } from "@/lib/format/date";

export function AdminOverview({ events, registrations, now }: { events: readonly Event[]; registrations: readonly Registration[]; now: number }) {
  const published = events.filter((event) => event.publicationStatus === "published").length;
  const drafts = events.filter((event) => event.publicationStatus === "draft").length;
  const registered = registrations.filter((registration) => registration.status === "registered" && new Date(registration.eventStartsAt).getTime() >= now).length;
  const waitlisted = registrations.filter((registration) => (registration.status === "waitlisted" || registration.status === "invited") && new Date(registration.eventStartsAt).getTime() >= now).length;
  const capacity = events.reduce((total, event) => total + event.capacity, 0);
  const pastRegistrations = registrations.filter((registration) => new Date(registration.eventStartsAt).getTime() < now && registration.status === "registered");
  const checkedIn = pastRegistrations.filter((registration) => registration.checkInStatus === "checked_in").length;
  const absent = pastRegistrations.filter((registration) => registration.checkInStatus === "absent").length;
  const upcomingUnpaid = registrations.filter((registration) => registration.status === "registered" && new Date(registration.eventStartsAt).getTime() >= now && registration.paymentStatus === "unpaid").length;

  return (
    <div className="mt-8 grid gap-6">
      <section aria-label="مؤشرات التشغيل" className="grid gap-px overflow-hidden border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="مسجلات للفعاليات القادمة" value={formatArabicNumber(registered)} note={`تتسع الفعاليات المنشورة لـ ${formatSeatCapacity(capacity)}`} />
        <StatCard label="بانتظار مقعد" value={formatArabicNumber(waitlisted)} note="اختاري البديلة بنفسك عند توفر مقعد" />
        <StatCard label="تم تسجيل حضورهن" value={formatArabicNumber(checkedIn)} note={`${formatArabicNumber(absent)} غائبة في الفعاليات السابقة`} />
        <StatCard label="دفعات تحتاج تسجيلًا" value={formatArabicNumber(upcomingUnpaid)} note="التسجيل يدوي داخل لوحة الإدارة" />
        <StatCard label="الفعاليات المنشورة" value={formatArabicNumber(published)} note="تظهر للعامة إذا كان موعدها قادمًا" />
        <StatCard label="المسودات" value={formatArabicNumber(drafts)} note="لا تظهر في الموقع العام" />
      </section>
      <EventCapacityTable events={events} compact />
    </div>
  );
}
