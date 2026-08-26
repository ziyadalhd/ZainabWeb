import type { AdminEventFeedbackResponse } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatArabicDateTime, formatArabicNumber } from "@/lib/format/date";

export function AdminEventFeedbackTable({ responses }: { responses: readonly AdminEventFeedbackResponse[] }) {
  if (responses.length === 0) {
    return <EmptyState title="لا توجد تقييمات مرسلة بعد" description="ستظهر الردود هنا بعد أن ترسل المشاركات تقييماتهن." />;
  }

  return (
    <div>
      <div className="table-scroll responsive-table-shell" tabIndex={0} role="region" aria-label="إجابات التقييم">
        <table className="operational-table responsive-admin-table w-full min-w-[54rem] border-collapse text-right text-sm">
          <caption className="sr-only">إجابات تقييم الفعاليات</caption>
          <thead>
            <tr>
              <th className="px-5 py-4">الفعالية</th>
              <th className="px-5 py-4">المشاركة</th>
              <th className="px-5 py-4">الضيافة</th>
              <th className="px-5 py-4">المادة</th>
              <th className="px-5 py-4">المقترحات</th>
              <th className="px-5 py-4">وقت الإرسال</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((response) => (
              <tr key={response.id} className="border-t border-[var(--color-border)] align-top">
                <td data-label="الفعالية" className="px-5 py-4 font-bold">
                  {response.eventTitle}
                </td>
                <td data-label="المشاركة" className="px-5 py-4">
                  {response.attendeeName ?? "مجهول"}
                </td>
                <td data-label="الضيافة" className="px-5 py-4">
                  {formatArabicNumber(response.hospitalityRating)} / ٥
                </td>
                <td data-label="المادة" className="px-5 py-4">
                  {formatArabicNumber(response.materialRating)} / ٥
                </td>
                <td data-label="المقترحات" className="max-w-sm px-5 py-4 whitespace-pre-wrap">
                  {response.suggestions ?? "—"}
                </td>
                <td data-label="وقت الإرسال" className="px-5 py-4 whitespace-nowrap">
                  {formatArabicDateTime(response.submittedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
