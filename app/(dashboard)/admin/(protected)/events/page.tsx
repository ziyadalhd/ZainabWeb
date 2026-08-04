import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventCapacityTable } from "@/features/admin/components/EventCapacityTable";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventRepository } from "@/lib/supabase/events";

export const metadata: Metadata = { title: "الفعاليات" };
export const dynamic = "force-dynamic";

const successMessages: Record<string, string> = { created: "تم حفظ الفعالية كمسودة.", updated: "تم حفظ تعديلات الفعالية.", status: "تم تحديث حالة النشر." };

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAdmin();
  const [{ success, error }, repository] = await Promise.all([searchParams, createAdminEventRepository()]);
  const events = await repository.list();
  return (
    <main className="px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5"><PageHeader eyebrow="لوحة الإدارة" title="الفعاليات" description="أنشئ المسودات وعدّل التوفر ثم انشر أو أرشف بإجراء مستقل." /><Link href="/admin/events/new" className="rounded-2xl bg-[var(--brand-green)] px-5 py-3 font-extrabold text-white">فعالية جديدة</Link></div>
      {success && successMessages[success] ? <p role="status" className="mt-6 rounded-2xl bg-[#e8f0e3] px-4 py-3 font-bold text-[var(--brand-green-deep)]">{successMessages[success]}</p> : null}
      {error ? <p role="alert" className="mt-6 rounded-2xl bg-red-50 px-4 py-3 font-bold text-red-800">تعذر تغيير حالة الفعالية. حدّث الصفحة وحاول مرة أخرى.</p> : null}
      <div className="mt-8"><EventCapacityTable events={events} /></div>
    </main>
  );
}
