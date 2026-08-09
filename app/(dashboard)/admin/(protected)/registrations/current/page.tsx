import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { RegistrationTable } from "@/features/admin/components/RegistrationTable";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";

export const metadata: Metadata = { title: "المسجلون الحاليون" };
export const dynamic = "force-dynamic";

const successMessages: Record<string, string> = {
  cancel: "تم إلغاء التسجيل، ويمكن الآن اختيار بديل من قائمة الانتظار.",
  confirm: "تم تأكيد حضور المسجل.",
};

export default async function CurrentRegistrationsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAdmin();
  const { success, error } = await searchParams;
  const repository = await createAdminRegistrationRepository();
  const registrations = (await repository.list()).filter((registration) => registration.status === "registered" && new Date(registration.eventStartsAt) >= new Date());
  return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="لوحة الإدارة" title="المسجلون الحاليون" description="الحجوزات المؤكدة للفعاليات القادمة والتواصل اليدوي عبر WhatsApp." />{success && successMessages[success] ? <p role="status" className="mt-6 rounded-2xl bg-[var(--color-success-bg)] px-4 py-3 font-bold text-[var(--color-success-text)]">{successMessages[success]}</p> : null}{error ? <p role="alert" className="mt-6 rounded-2xl bg-[var(--color-error-bg)] px-4 py-3 font-bold text-[var(--color-error-text)]">تعذر تنفيذ الإجراء. حدّث الصفحة وحاول مرة أخرى.</p> : null}<div className="mt-8"><RegistrationTable registrations={registrations} mode="current" /></div></main>;
}
