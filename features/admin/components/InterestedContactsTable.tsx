import type { AdminInterestedContact } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatArabicDateTime } from "@/lib/format/date";

export function InterestedContactsTable({ contacts }: { contacts: readonly AdminInterestedContact[] }) {
  if (contacts.length === 0) return <EmptyState title="لا توجد مهتمات حتى الآن" description="ستظهر هنا من وافقت على تلقي معلومات الفعاليات القادمة." />;

  return (
    <div>
      <div className="table-scroll responsive-table-shell" tabIndex={0} role="region" aria-label="قائمة المهتمات">
      <table className="operational-table responsive-admin-table w-full min-w-[56rem] border-collapse text-right text-sm">
        <caption className="sr-only">قائمة المهتمات وموافقة تلقي معلومات الفعاليات القادمة</caption>
        <thead><tr><th className="px-5 py-4">الاسم</th><th className="px-5 py-4">الجوال</th><th className="px-5 py-4">البريد</th><th className="px-5 py-4">الموافقة</th><th className="px-5 py-4">تاريخ التسجيل</th></tr></thead>
        <tbody>{contacts.map((contact) => <tr key={contact.id} className="border-t border-[var(--color-border)]"><td data-label="الاسم" className="px-5 py-4 font-bold">{contact.contactName}</td><td data-label="الجوال" className="data-value px-5 py-4" dir="ltr"><a className="underline decoration-[var(--brand-olive)] underline-offset-4" href={`https://wa.me/${contact.phoneE164.replace("+", "")}`} target="_blank" rel="noreferrer">{contact.phoneE164}</a></td><td data-label="البريد" className="max-w-64 break-all px-5 py-4 md:whitespace-nowrap" dir="ltr"><a className="underline decoration-[var(--brand-olive)] underline-offset-4" href={`mailto:${contact.email}`}>{contact.email}</a></td><td data-label="الموافقة" className="px-5 py-4"><StatusBadge status={contact.unsubscribedAt ? "unsubscribed" : "subscribed"} /></td><td data-label="تاريخ التسجيل" className="data-value px-5 py-4 text-xs muted-copy">{formatArabicDateTime(contact.consentedAt)}</td></tr>)}</tbody>
      </table>
      </div>
    </div>
  );
}
