import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { RegistrationTable } from "@/features/admin/components/RegistrationTable";
import { demoAdminDashboardSource } from "@/lib/demo/repositories";

export const metadata: Metadata = { title: "المسجلون الحاليون" };

export default async function CurrentRegistrationsPage() {
  const snapshot = await demoAdminDashboardSource.getSnapshot();
  const registrations = snapshot.registrations.filter((item) => item.recordKind === "current");
  return (
    <main className="px-4 py-8 sm:px-8">
      <PageHeader eyebrow="بيانات اصطناعية" title="المسجلون الحاليون" description="لا تعرض هذه الصفحة أسماء أو وسائل اتصال حقيقية." />
      <div className="mt-8"><RegistrationTable registrations={registrations} /></div>
    </main>
  );
}
