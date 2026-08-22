import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminOverview } from "@/features/admin/components/AdminOverview";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";
import { createAdminServiceRequestRepository } from "@/lib/supabase/service-requests";
import { getCurrentTimestamp } from "@/lib/time/clock";

export const metadata: Metadata = { title: "اليوم" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [eventRepository, registrationRepository, requestRepository] = await Promise.all([createAdminEventRepository(), createAdminRegistrationRepository(), createAdminServiceRequestRepository()]);
  const [events, registrations, requests] = await Promise.all([eventRepository.list(), registrationRepository.list(), requestRepository.list()]);
  return <main className="admin-page"><PageHeader eyebrow="لوحة الإدارة" title="نظرة عامة" description="ابدئي بما يحتاج انتباهك الآن، ثم انتقلي إلى الفعالية أو الطلب المرتبط." /><AdminOverview events={events} registrations={registrations} requests={requests} now={getCurrentTimestamp()} /></main>;
}
