import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "تقييم الفعالية",
  robots: { index: false, follow: false },
  alternates: null,
};

export default function EventFeedbackPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="استبيانات" title="تقييم الفعالية" description="يُرسل النادي رابط التقييم لكل مشاركة بعد الفعالية." />
    </main>
  );
}
