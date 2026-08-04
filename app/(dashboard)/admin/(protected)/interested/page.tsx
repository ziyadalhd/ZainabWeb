import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "المهتمون" };
export default async function InterestedPage() { await requireAdmin(); return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="لوحة الإدارة" title="المهتمون" /><EmptyState title="تسجيل المهتمين غير مفعل" description="لن تُجمع بيانات المهتمين قبل اعتماد الحقول وآلية الحفظ." /></main>; }
