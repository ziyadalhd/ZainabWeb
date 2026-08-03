import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "المسجلون الحاليون" };
export default async function CurrentRegistrationsPage() { await requireAdmin(); return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="لوحة الإدارة" title="المسجلون الحاليون" /><EmptyState title="التسجيلات غير مفعلة" description="إدارة تسجيلات الفعاليات خارج نطاق هذه المرحلة، ولا توجد سجلات محفوظة." /></main>; }
