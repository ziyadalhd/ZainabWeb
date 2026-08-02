import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export function ContentPlaceholderPage({ title, eyebrow = "نادي بَيْن الثقافي" }: { title: string; eyebrow?: string }) {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow={eyebrow} title={title} />
      <EmptyState title="المحتوى قيد الإعداد" description="محتوى هذه الصفحة قيد الإعداد." />
    </main>
  );
}
