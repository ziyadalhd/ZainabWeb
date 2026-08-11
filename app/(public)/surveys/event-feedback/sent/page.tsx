import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "تم إرسال التقييم" };

export default function EventFeedbackSentPage() {
  return <main className="page-shell section-space"><PageHeader eyebrow="استبيانات" title="شكرًا لمشاركتك" /><EmptyState title="تم إرسال التقييم" description="وصلت إجابتك، ولن يقبل رابط التقييم هذا استجابة أخرى." /></main>;
}
