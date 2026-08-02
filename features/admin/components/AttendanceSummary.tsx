import type { Event } from "@/lib/domain/types";
import { formatArabicNumber } from "@/lib/format/date";

export function AttendanceSummary({ events }: { events: readonly Event[] }) {
  const registered = events.reduce((total, event) => total + event.registrationCount, 0);
  const confirmed = events.reduce((total, event) => total + event.attendanceConfirmedCount, 0);

  return (
    <section className="rounded-3xl bg-[var(--brand-green)] p-6 text-[var(--brand-ivory)]">
      <p className="text-sm font-bold text-white/70">تأكيدات الحضور التجريبية</p>
      <div className="mt-4 flex items-end gap-3">
        <strong className="text-4xl">{formatArabicNumber(confirmed)}</strong>
        <span className="pb-1 text-sm text-white/70">من {formatArabicNumber(registered)} تسجيلًا</span>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
        <div className="h-full rounded-full bg-[var(--brand-ivory)]" style={{ width: registered === 0 ? "0%" : `${Math.round((confirmed / registered) * 100)}%` }} />
      </div>
    </section>
  );
}
