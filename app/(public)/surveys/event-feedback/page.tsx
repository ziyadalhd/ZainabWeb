import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventFeedbackFormPreview } from "@/features/surveys/components/EventFeedbackFormPreview";

export const metadata: Metadata = { title: "تقييم الفعالية" };

export default function EventFeedbackPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="استبيانات" title="تقييم الفعالية" description="واجهة أولية بالحقول المعتمدة فقط." />
      <div className="max-w-2xl"><EventFeedbackFormPreview /></div>
    </main>
  );
}
