import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "تقييم الفعالية" };

export default function EventFeedbackPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="استبيانات" title="تقييم الفعالية" description="يُرسل النادي رابطًا آمنًا خاصًا بكل مشاركة بعد الفعالية." />
    </main>
  );
}
