import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventCapacityTable } from "@/features/admin/components/EventCapacityTable";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventRepository } from "@/lib/supabase/events";

export const metadata: Metadata = { title: "الفعاليات" };
export const dynamic = "force-dynamic";

const successMessages: Record<string, string> = { created: "تم حفظ الفعالية كمسودة.", updated: "تم حفظ تعديلات الفعالية.", status: "تم تحديث حالة النشر." };
const errorMessages: Record<string, string> = {
  status: "تعذر تغيير حالة الفعالية. حدّث الصفحة وحاول مرة أخرى.",
  incomplete: "أكمل وقت النهاية والسعر في صفحة التعديل قبل نشر الفعالية.",
};

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAdmin();
  const [{ success, error }, repository] = await Promise.all([searchParams, createAdminEventRepository()]);
  const events = await repository.list();
  return (
    <main className="admin-page">
      <div className="flex flex-wrap items-end justify-between gap-5"><PageHeader eyebrow="لوحة الإدارة" title="الفعاليات" description="أنشئ المسودات وعدّل التوفر ثم انشر أو أرشف بإجراء مستقل." /><Link href="/admin/events/new" className="button-primary">فعالية جديدة</Link></div>
      {success && successMessages[success] ? <p role="status" className="notice-success mt-6">{successMessages[success]}</p> : null}
      {error && errorMessages[error] ? <p role="alert" className="notice-error mt-6">{errorMessages[error]}</p> : null}
      <div className="mt-8"><EventCapacityTable events={events} /></div>
    </main>
  );
}
