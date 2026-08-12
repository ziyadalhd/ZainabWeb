import type { Metadata } from "next";
import Link from "next/link";
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
  return <main className="admin-page"><div className="flex flex-wrap items-end justify-between gap-5"><PageHeader eyebrow="لوحة الإدارة" title="قائمة الانتظار" description="الترتيب حسب وقت التسجيل. اختاري البديلة يدويًا بعد توفر مقعد؛ تتحول إلى دعوة لمدة 6 ساعات ولا توجد ترقية تلقائية." /><Link href="/admin/registrations/export?scope=waitlist" className="button-secondary">تنزيل CSV</Link></div>{success && successMessages[success] ? <p role="status" className="notice-success mt-6">{successMessages[success]}</p> : null}{error ? <p role="alert" className="notice-error mt-6">تعذر تنفيذ الإجراء. قد تكون السعة مكتملة أو تغير السجل.</p> : null}<div className="mt-8"><RegistrationTable registrations={registrations} mode="waitlist" /></div></main>;
}
