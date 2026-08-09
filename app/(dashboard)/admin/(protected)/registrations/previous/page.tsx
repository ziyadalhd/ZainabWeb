import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { RegistrationTable } from "@/features/admin/components/RegistrationTable";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";

export const metadata: Metadata = { title: "المسجلون السابقون" };
export const dynamic = "force-dynamic";

export default async function PreviousRegistrationsPage() {
  await requireAdmin();
  const repository = await createAdminRegistrationRepository();
  const registrations = (await repository.list()).filter((registration) => registration.status === "cancelled" || new Date(registration.eventStartsAt) < new Date());
  return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="لوحة الإدارة" title="المسجلون السابقون" description="التسجيلات الملغاة أو المرتبطة بفعاليات انتهى موعدها، وتُحذف بياناتها وفق مدة الاحتفاظ." /><div className="mt-8"><RegistrationTable registrations={registrations} mode="previous" /></div></main>;
}
