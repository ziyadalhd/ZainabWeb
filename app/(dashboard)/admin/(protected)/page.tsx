import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminOverview } from "@/features/admin/components/AdminOverview";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventRepository } from "@/lib/supabase/events";

export const metadata: Metadata = { title: "نظرة عامة" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const repository = await createAdminEventRepository();
  const events = await repository.list();
  return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="لوحة الإدارة" title="نظرة عامة" description="ملخص مباشر لحالات الفعاليات المحفوظة في Supabase." /><AdminOverview events={events} /></main>;
}
