import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "الاستبيانات" };
export default async function AdminSurveysPage() { await requireAdmin(); return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="لوحة الإدارة" title="الاستبيانات" /><EmptyState title="حفظ الاستبيانات غير مفعل" description="واجهات الاستبيان الحالية لا ترسل أو تحفظ أي استجابة." /></main>; }
