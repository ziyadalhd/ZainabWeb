import type { Metadata } from "next";
import Link from "next/link";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventCapacityTable } from "@/features/admin/components/EventCapacityTable";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { changeEventStatusAction } from "@/app/(dashboard)/admin/(protected)/events/actions";

export const metadata: Metadata = { title: "الفعاليات" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const successMessages: Record<string, string> = { created: "تم حفظ الفعالية كمسودة.", updated: "تم حفظ تعديلات الفعالية.", status: "تم تحديث حالة النشر." };
const errorMessages: Record<string, string> = {
  status: "تعذر تغيير حالة الفعالية. حدّث الصفحة وحاول مرة أخرى.",
  incomplete: "أكمل وقت النهاية والسعر في صفحة التعديل قبل نشر الفعالية.",
};

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string; notice?: string }> }) {
  await requireAdmin();
  const [{ success, error, notice }, repository] = await Promise.all([searchParams, createAdminEventRepository()]);
  const events = await repository.list();
  return (
    <main className="admin-page">
      <div className="flex flex-wrap items-end justify-between gap-5"><PageHeader eyebrow="الفعاليات" title="الفعاليات والتقويم" description="أضيفي فعالية، راجعي تفاصيلها، ثم انشريها عندما تصبح جاهزة." /><div className="flex flex-wrap gap-2"><Link href="/admin/calendar" className="button-secondary">فتح التقويم</Link><Link href="/admin/events/new" className="button-primary">فعالية جديدة</Link></div></div>
      {success && successMessages[success] ? <p role="status" className="notice-success mt-6">{successMessages[success]}</p> : null}
      {error && errorMessages[error] ? <p role="alert" className="notice-error mt-6">{errorMessages[error]}</p> : null}
      {notice === "communications" ? <p className="notice-info mt-6">اختاري الفعالية، ثم افتحي تبويب «التواصل» لإدارة جميع رسائلها في مكان واحد.</p> : null}
      {events.ok
        ? <div className="mt-8"><EventCapacityTable events={events.data} statusAction={changeEventStatusAction} /></div>
        : <LoadErrorNotice />}
    </main>
  );
}
