import type { WaitlistEntry } from "@/lib/domain/types";

export function WaitlistTable({ entries }: { entries: readonly WaitlistEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-[var(--border)] bg-white">
      <table className="w-full min-w-[520px] border-collapse text-right text-sm">
        <caption className="sr-only">سجلات انتظار تجريبية دون ترتيب أولوية</caption>
        <thead className="bg-[var(--surface-soft)] text-[var(--brand-green-deep)]">
          <tr><th className="px-5 py-4">السجل</th><th className="px-5 py-4">معرف الفعالية</th><th className="px-5 py-4">الحالة</th></tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t border-[var(--border)]">
              <td className="px-5 py-4 font-bold">{entry.displayLabel}</td>
              <td className="px-5 py-4 font-mono text-xs" dir="ltr">{entry.eventId}</td>
              <td className="px-5 py-4 muted-copy">انتظار تجريبي — بلا أولوية</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
