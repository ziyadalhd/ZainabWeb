import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventCapacityTable } from "@/features/admin/components/EventCapacityTable";
import { demoEventCatalog } from "@/lib/demo/repositories";

export const metadata: Metadata = { title: "الفعاليات" };

export default async function AdminEventsPage() {
  const events = await demoEventCatalog.listEvents();
  return (
    <main className="px-4 py-8 sm:px-8">
      <PageHeader eyebrow="لوحة الإدارة" title="الفعاليات" description="عرض السعة والتسجيل والحالة كما ترد في البيانات التجريبية." />
      <div className="mt-8"><EventCapacityTable events={events} /></div>
    </main>
  );
}
