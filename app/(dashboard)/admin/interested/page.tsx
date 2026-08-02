import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "المهتمون" };

export default function InterestedPage() {
  return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="لوحة الإدارة" title="المهتمون" /><EmptyState title="لا توجد بيانات معروضة" description="لن تُجمع بيانات المهتمين قبل اعتماد حقول النموذج وآلية الحفظ." /></main>;
}
