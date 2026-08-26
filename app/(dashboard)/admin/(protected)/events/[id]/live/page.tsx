import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { EventCheckInMode } from "@/features/admin/components/EventCheckInMode";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";
import { recordCheckInAction } from "@/app/(dashboard)/admin/(protected)/registrations/actions";

export const metadata: Metadata = { title: "تسجيل الحضور" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EventLiveCheckInPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [eventRepository, registrationRepository] = await Promise.all([
    createAdminEventRepository(),
    createAdminRegistrationRepository(),
  ]);
  const event = await eventRepository.get(id);
  if (!event) notFound();

  const registrationsOutcome = await registrationRepository.listForEvent(event.id);

  return (
    <main className="admin-page max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">وضع اليوم</p>
          <h1 className="page-title mt-1">{event.title}</h1>
        </div>
        <Link href={`/admin/events/${event.id}`} className="button-quiet">إنهاء وضع اليوم</Link>
      </div>
      <div className="mt-6">
        {registrationsOutcome.ok ? (
          <EventCheckInMode
            registrations={registrationsOutcome.data.filter((registration) => registration.status === "registered")}
            recordCheckIn={recordCheckInAction}
          />
        ) : <LoadErrorNotice description="تعذر تحميل قائمة المسجلات. حدّثي الصفحة وحاولي مرة أخرى." />}
      </div>
    </main>
  );
}
