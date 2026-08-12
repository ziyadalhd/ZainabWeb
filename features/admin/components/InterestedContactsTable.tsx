import type { AdminInterestedContact } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatArabicDateTime } from "@/lib/format/date";

export function InterestedContactsTable({ contacts }: { contacts: readonly AdminInterestedContact[] }) {
  if (contacts.length === 0) return <EmptyState title="لا توجد مهتمات حتى الآن" description="ستظهر هنا من وافقت على تلقي معلومات الفعاليات القادمة." />;

  return (
    <div>
      <p className="mb-2 text-xs font-bold muted-copy md:hidden">مرري الجدول أفقيًا لعرض جميع بيانات التواصل.</p>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="قائمة المهتمات؛ يمكن تمريرها أفقيًا">
      <table className="operational-table w-full min-w-[56rem] border-collapse text-right text-sm">
        <caption className="sr-only">قائمة المهتمات وموافقة تلقي معلومات الفعاليات القادمة</caption>
        <thead><tr><th className="px-5 py-4">الاسم</th><th className="px-5 py-4">الجوال</th><th className="px-5 py-4">البريد</th><th className="px-5 py-4">الموافقة</th><th className="px-5 py-4">تاريخ التسجيل</th></tr></thead>
        <tbody>{contacts.map((contact) => <tr key={contact.id} className="border-t border-[var(--color-border)]"><td className="px-5 py-4 font-bold">{contact.contactName}</td><td className="data-value px-5 py-4" dir="ltr">{contact.phoneE164}</td><td className="max-w-64 break-all px-5 py-4" dir="ltr">{contact.email}</td><td className="px-5 py-4"><StatusBadge status={contact.unsubscribedAt ? "unsubscribed" : "subscribed"} /></td><td className="data-value px-5 py-4 text-xs muted-copy">{formatArabicDateTime(contact.consentedAt)}</td></tr>)}</tbody>
      </table>
      </div>
    </div>
  );
}
