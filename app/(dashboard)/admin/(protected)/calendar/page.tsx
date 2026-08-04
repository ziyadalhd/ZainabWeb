import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { CalendarMonthGrid } from "@/features/admin/components/CalendarMonthGrid";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventRepository } from "@/lib/supabase/events";

export const metadata: Metadata = { title: "التقويم" };
export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  await requireAdmin();
  const repository = await createAdminEventRepository();
  const events = await repository.list();
  return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="لوحة الإدارة" title="التقويم" description="تقويم ميلادي عربي يعرض الفعاليات المحفوظة بتوقيت الرياض." /><div className="mt-8"><CalendarMonthGrid events={events} /></div></main>;
}
