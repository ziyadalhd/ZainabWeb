import Link from "next/link";
import type { AdminRegistrationListView, Registration } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface EventRegistrationRosterProps {
  registrations: readonly Registration[];
  eventId: string;
  view: AdminRegistrationListView;
  emptyTitle: string;
  emptyDescription: string;
}

export function EventRegistrationRoster({ registrations, eventId, view, emptyTitle, emptyDescription }: EventRegistrationRosterProps) {
  if (registrations.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const manageAllHref = `/admin/registrations?event=${eventId}&view=${view}`;

  return (
    <div>
      <div className="table-scroll responsive-table-shell" tabIndex={0} role="region" aria-label="قائمة المسجلات">
        <table className="operational-table responsive-admin-table w-full min-w-[48rem] border-collapse text-right text-sm">
          <caption className="sr-only">أسماء المسجلات وحالة كل تسجيل</caption>
          <thead>
            <tr>
              <th className="px-5 py-4">الاسم</th>
              <th className="px-5 py-4">الجوال</th>
              <th className="px-5 py-4">الحالة</th>
              <th className="px-5 py-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((registration) => (
              <tr key={registration.id} className="border-t border-[var(--color-border)]">
                <td data-label="الاسم" className="px-5 py-4 font-bold">{registration.attendeeName}</td>
                <td data-label="الجوال" className="data-value px-5 py-4" dir="ltr">{registration.phoneE164}</td>
                <td data-label="الحالة" className="px-5 py-4"><StatusBadge status={registration.status} /></td>
                <td data-label="الإجراءات" className="px-5 py-4">
                  <Link href={`/admin/registrations?event=${eventId}&view=${view}&id=${registration.id}`} className="button-secondary min-h-9 px-3 py-1.5 text-sm">فتح</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href={manageAllHref} className="mt-4 inline-block text-sm font-bold underline decoration-[var(--brand-amber)] underline-offset-4">إدارة كل التسجيلات لهذه الفعالية</Link>
    </div>
  );
}
