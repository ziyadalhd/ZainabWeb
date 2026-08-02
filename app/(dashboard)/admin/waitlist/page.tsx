import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { WaitlistTable } from "@/features/admin/components/WaitlistTable";
import { demoAdminDashboardSource } from "@/lib/demo/repositories";

export const metadata: Metadata = { title: "قائمة الانتظار" };

export default async function WaitlistPage() {
  const snapshot = await demoAdminDashboardSource.getSnapshot();
  return (
    <main className="px-4 py-8 sm:px-8">
      <PageHeader eyebrow="بيانات اصطناعية" title="قائمة الانتظار" description="عرض تجريبي بلا ترتيب أولوية أو استبدال تلقائي." />
      <div className="mt-8"><WaitlistTable entries={snapshot.waitlistEntries} /></div>
    </main>
  );
}
