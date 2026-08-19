import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventFeedbackRepository } from "@/lib/supabase/event-feedback";
import { AdminEventFeedbackTable } from "@/features/surveys/components/AdminEventFeedbackTable";

export const metadata: Metadata = { title: "الاستبيانات" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSurveysPage() {
  await requireAdmin();
  const repository = await createAdminEventFeedbackRepository();
  const responses = await repository.listSubmitted();
  return <main className="admin-page"><PageHeader eyebrow="لوحة الإدارة" title="الاستبيانات" description="تظهر التقييمات المرسلة بالاسم فقط عندما تختار المشاركة إظهاره." /><div className="mt-8"><AdminEventFeedbackTable responses={responses} /></div></main>;
}
