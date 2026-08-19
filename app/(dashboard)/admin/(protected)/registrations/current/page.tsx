import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { RegistrationTable } from "@/features/admin/components/RegistrationTable";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";

export const metadata: Metadata = { title: "المسجلات الحاليات" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const successMessages: Record<string, string> = {
  cancel: "تم إلغاء التسجيل، ويمكن الآن اختيار بديل من قائمة الانتظار.",
  confirm: "تم تأكيد حضور المسجل.",
  "check-in": "تم حفظ حالة حضور المسجل.",
};

export default async function CurrentRegistrationsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAdmin();
  const { success, error } = await searchParams;
  const repository = await createAdminRegistrationRepository();
  const registrations = (await repository.list()).filter((registration) => registration.status === "registered" && new Date(registration.eventStartsAt) >= new Date());
  return <main className="admin-page"><div className="flex flex-wrap items-end justify-between gap-5"><PageHeader eyebrow="لوحة الإدارة" title="المسجلات الحاليات" description="تابعي حجوزات الفعاليات القادمة، وأرسلي التذكيرات، وسجّلي الحضور من مكان واحد." /><Link href="/admin/registrations/export?scope=current" className="button-secondary">تنزيل القائمة</Link></div>{success && successMessages[success] ? <p role="status" className="notice-success mt-6">{successMessages[success]}</p> : null}{error ? <p role="alert" className="notice-error mt-6">تعذر تنفيذ الإجراء. حدّثي الصفحة وحاولي مرة أخرى.</p> : null}<div className="mt-8"><RegistrationTable registrations={registrations} mode="current" /></div></main>;
}
