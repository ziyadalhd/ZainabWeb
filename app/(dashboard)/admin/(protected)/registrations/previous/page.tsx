import type { Metadata } from "next";
import Link from "next/link";
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
  return <main className="admin-page"><div className="flex flex-wrap items-end justify-between gap-5"><PageHeader eyebrow="لوحة الإدارة" title="المسجلون السابقون" description="التسجيلات الملغاة أو المرتبطة بفعاليات انتهى موعدها، وتُحذف بياناتها وفق مدة الاحتفاظ." /><Link href="/admin/registrations/export?scope=previous" className="button-secondary">تنزيل CSV</Link></div><div className="mt-8"><RegistrationTable registrations={registrations} mode="previous" /></div></main>;
}
