import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { RegistrationTable } from "@/features/admin/components/RegistrationTable";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";

export const metadata: Metadata = { title: "قائمة الانتظار" };
export const dynamic = "force-dynamic";

const successMessages: Record<string, string> = {
  revoke: "تم سحب الدعوة وإعادة السجل إلى قائمة الانتظار.",
  cancel: "تم إلغاء سجل الانتظار.",
};

export default async function WaitlistPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAdmin();
  const { success, error } = await searchParams;
  const repository = await createAdminRegistrationRepository();
  const registrations = (await repository.list())
    .filter((registration) => registration.status === "waitlisted" || registration.status === "invited")
    .sort((first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime());
  return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="لوحة الإدارة" title="قائمة الانتظار" description="الترتيب حسب وقت التسجيل. اختاري البديلة يدويًا بعد توفر مقعد؛ تتحول إلى دعوة لمدة 6 ساعات ولا توجد ترقية تلقائية." />{success && successMessages[success] ? <p role="status" className="mt-6 rounded-2xl bg-[var(--color-success-bg)] px-4 py-3 font-bold text-[var(--color-success-text)]">{successMessages[success]}</p> : null}{error ? <p role="alert" className="mt-6 rounded-2xl bg-[var(--color-error-bg)] px-4 py-3 font-bold text-[var(--color-error-text)]">تعذر تنفيذ الإجراء. قد تكون السعة مكتملة أو تغير السجل.</p> : null}<div className="mt-8"><RegistrationTable registrations={registrations} mode="waitlist" /></div></main>;
}
