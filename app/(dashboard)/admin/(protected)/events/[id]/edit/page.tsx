import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventForm } from "@/features/admin/components/EventForm";
import { EventPosterForm } from "@/features/admin/components/EventPosterForm";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { updateEventAction, uploadEventPosterAction } from "@/app/(dashboard)/admin/(protected)/events/actions";

export const metadata: Metadata = { title: "تعديل الفعالية" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const repository = await createAdminEventRepository();
  const event = await repository.get(id);
  if (!event) notFound();

  return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="إدارة الفعاليات" title="تعديل الفعالية" description={`حالة النشر الحالية: ${event.publicationStatus === "draft" ? "مسودة" : event.publicationStatus === "published" ? "منشورة" : "مؤرشفة"}.`} /><EventForm action={updateEventAction.bind(null, id)} event={event} submitLabel="حفظ التعديلات" /><EventPosterForm eventTitle={event.title} posterUrl={event.posterUrl} action={uploadEventPosterAction.bind(null, id)} /></main>;
}
