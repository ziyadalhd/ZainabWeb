import type { AdminEventFeedbackResponse } from "@/lib/domain/types";
import { formatArabicNumber } from "@/lib/format/date";
import { AdminEventFeedbackTable } from "@/features/surveys/components/AdminEventFeedbackTable";

export function FeedbackWorkspace({ responses }: { responses: readonly AdminEventFeedbackResponse[] }) {
  const average = (key: "hospitalityRating" | "materialRating") => responses.length
    ? new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 1 }).format(responses.reduce((sum, response) => sum + response[key], 0) / responses.length)
    : "—";

  return (
    <div className="feedback-workspace">
      <dl className="feedback-summary" aria-label="ملخص التقييمات">
        <div><dt>عدد الردود</dt><dd>{formatArabicNumber(responses.length)}</dd></div>
        <div><dt>متوسط الضيافة</dt><dd>{average("hospitalityRating")} <small>من ٥</small></dd></div>
        <div><dt>متوسط المادة</dt><dd>{average("materialRating")} <small>من ٥</small></dd></div>
      </dl>
      <section aria-labelledby="feedback-responses-heading">
        <h3 id="feedback-responses-heading" className="mb-4 text-xl font-bold">ردود المشاركات ومقترحاتهن</h3>
        <AdminEventFeedbackTable responses={responses} />
      </section>
    </div>
  );
}
