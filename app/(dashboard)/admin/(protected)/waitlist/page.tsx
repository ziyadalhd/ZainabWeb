import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "قائمة الانتظار" };
export default async function WaitlistPage() { await requireAdmin(); return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="لوحة الإدارة" title="قائمة الانتظار" /><EmptyState title="قائمة الانتظار غير مفعلة" description="لا توجد أولوية أو سجلات انتظار قبل تنفيذ التسجيلات في مرحلة لاحقة." /></main>; }
