import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "وصل تقييمك", robots: { index: false, follow: false }, alternates: null };

export default function EventFeedbackSentPage() {
  return <main className="page-shell section-space"><PageHeader eyebrow="استبيانات" title="شكرًا لمشاركتك" /><EmptyState title="وصل تقييمك" description="سجّلنا إجابتك، ولن يقبل هذا الرابط إجابة أخرى." /></main>;
}
