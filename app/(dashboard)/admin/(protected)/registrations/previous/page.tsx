import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "المسجلون السابقون" };
export default async function PreviousRegistrationsPage() { await requireAdmin(); return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="لوحة الإدارة" title="المسجلون السابقون" /><EmptyState title="التسجيلات غير مفعلة" description="لن تظهر سجلات سابقة قبل تنفيذ نظام التسجيل في مرحلة لاحقة." /></main>; }
