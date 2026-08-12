import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminOverview } from "@/features/admin/components/AdminOverview";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";
import { getCurrentTimestamp } from "@/lib/time/clock";

export const metadata: Metadata = { title: "نظرة عامة" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [eventRepository, registrationRepository] = await Promise.all([
    createAdminEventRepository(),
    createAdminRegistrationRepository(),
  ]);
  const [events, registrations] = await Promise.all([
    eventRepository.list(),
    registrationRepository.list(),
  ]);
  const now = getCurrentTimestamp();
  return <main className="admin-page"><PageHeader eyebrow="لوحة الإدارة" title="نظرة عامة" description="ملخص مباشر للفعاليات والتسجيلات وقائمة الانتظار." /><AdminOverview events={events} registrations={registrations} now={now} /></main>;
}
