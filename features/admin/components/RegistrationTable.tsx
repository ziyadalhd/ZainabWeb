import type { Registration } from "@/lib/domain/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function RegistrationTable({ registrations }: { registrations: readonly Registration[] }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-[var(--border)] bg-white">
      <table className="w-full min-w-[560px] border-collapse text-right text-sm">
        <caption className="sr-only">سجلات تسجيل تجريبية</caption>
        <thead className="bg-[var(--surface-soft)] text-[var(--brand-green-deep)]">
          <tr><th className="px-5 py-4">السجل</th><th className="px-5 py-4">معرف الفعالية</th><th className="px-5 py-4">الحضور</th></tr>
        </thead>
        <tbody>
          {registrations.map((registration) => (
            <tr key={registration.id} className="border-t border-[var(--border)]">
              <td className="px-5 py-4 font-bold">{registration.displayLabel}</td>
              <td className="px-5 py-4 font-mono text-xs" dir="ltr">{registration.eventId}</td>
              <td className="px-5 py-4"><StatusBadge status={registration.attendanceStatus} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
