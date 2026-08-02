import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "طلب تقديم ورشة" };

export default function WorkshopApplicationPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="استبيانات" title="طلب تقديم ورشة" />
      <EmptyState title="الحقول قيد الاعتماد" description="سيتم إتاحة النموذج بعد اعتماد الحقول المطلوبة." />
    </main>
  );
}
