import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminOverview } from "@/features/admin/components/AdminOverview";
import { demoAdminDashboardSource } from "@/lib/demo/repositories";

export const metadata: Metadata = { title: "نظرة عامة" };

export default async function AdminOverviewPage() {
  const snapshot = await demoAdminDashboardSource.getSnapshot();
  return (
    <main className="px-4 py-8 sm:px-8">
      <PageHeader eyebrow="لوحة الإدارة" title="نظرة عامة" description="ملخص مرئي يعتمد على سجلات اصطناعية للعرض فقط." />
      <AdminOverview snapshot={snapshot} />
    </main>
  );
}
