import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventForm } from "@/features/admin/components/EventForm";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { updateEventAction } from "@/app/(dashboard)/admin/(protected)/events/actions";

export const metadata: Metadata = { title: "تعديل الفعالية" };

const errors: Record<string, string> = {
  title: "أدخل عنوانًا للفعالية.", audience: "اختر فئة صحيحة.", eventTypeLabel: "أدخل نوع الفعالية.",
  startsAt: "أدخل تاريخًا ووقتًا صحيحين بتوقيت الرياض.", capacity: "يجب أن تكون السعة عددًا صحيحًا أكبر من صفر.",
  availability: "اختر حالة توفر صحيحة.", save: "تعذر حفظ التعديلات. حاول مرة أخرى.",
};

export default async function EditEventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const repository = await createAdminEventRepository();
  const event = await repository.get(id);
  if (!event) notFound();

  return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="إدارة الفعاليات" title="تعديل الفعالية" description={`حالة النشر الحالية: ${event.publicationStatus === "draft" ? "مسودة" : event.publicationStatus === "published" ? "منشورة" : "مؤرشفة"}.`} /><EventForm action={updateEventAction.bind(null, id)} event={event} submitLabel="حفظ التعديلات" errorMessage={error ? errors[error] : undefined} /></main>;
}
