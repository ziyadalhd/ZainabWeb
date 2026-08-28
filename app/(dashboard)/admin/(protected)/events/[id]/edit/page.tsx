import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventForm } from "@/features/admin/components/EventForm";
import { EventPosterForm } from "@/features/admin/components/EventPosterForm";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { updateEventAction, uploadEventPosterAction } from "@/app/(dashboard)/admin/(protected)/events/actions";

export const metadata: Metadata = { title: "تعديل الفعالية" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const repository = await createAdminEventRepository();
  const event = await repository.get(id);
  if (!event) notFound();

  return (
    <main className="admin-page">
      <nav aria-label="مسار التنقل" className="mb-5 text-sm font-medium muted-copy">
        <Link href="/admin/events" className="underline decoration-[var(--brand-olive)] underline-offset-4">
          الفعاليات
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/admin/events?event=${event.id}`} className="underline decoration-[var(--brand-olive)] underline-offset-4">
          {event.title}
        </Link>
        <span aria-hidden="true"> / </span>
        <span>تعديل</span>
      </nav>
      <PageHeader eyebrow="إدارة الفعاليات" title="تعديل الفعالية" />
      <EventForm action={updateEventAction.bind(null, id)} event={event} submitLabel="حفظ التعديلات" />
      <EventPosterForm eventTitle={event.title} posterUrl={event.posterUrl} action={uploadEventPosterAction.bind(null, id)} />
    </main>
  );
}
