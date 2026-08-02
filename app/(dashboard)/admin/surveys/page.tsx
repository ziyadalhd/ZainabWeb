import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "الاستبيانات" };

export default function AdminSurveysPage() {
  return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="لوحة الإدارة" title="الاستبيانات" /><EmptyState title="لا توجد ردود محفوظة" description="واجهات المرحلة الأولى لا ترسل أو تحفظ أي استجابة." /></main>;
}
