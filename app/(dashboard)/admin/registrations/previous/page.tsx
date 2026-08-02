import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { RegistrationTable } from "@/features/admin/components/RegistrationTable";
import { demoAdminDashboardSource } from "@/lib/demo/repositories";

export const metadata: Metadata = { title: "المسجلون السابقون" };

export default async function PreviousRegistrationsPage() {
  const snapshot = await demoAdminDashboardSource.getSnapshot();
  const registrations = snapshot.registrations.filter((item) => item.recordKind === "previous");
  return (
    <main className="px-4 py-8 sm:px-8">
      <PageHeader eyebrow="بيانات اصطناعية" title="المسجلون السابقون" description="سجلات تجريبية توضح شكل الواجهة فقط." />
      <div className="mt-8"><RegistrationTable registrations={registrations} /></div>
    </main>
  );
}
