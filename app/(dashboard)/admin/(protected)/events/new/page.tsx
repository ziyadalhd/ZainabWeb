import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventForm } from "@/features/admin/components/EventForm";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createEventAction } from "@/app/(dashboard)/admin/(protected)/events/actions";

export const metadata: Metadata = { title: "فعالية جديدة" };

const errors: Record<string, string> = {
  title: "أدخل عنوانًا للفعالية.", audience: "اختر فئة صحيحة.", eventTypeLabel: "أدخل نوع الفعالية.",
  startsAt: "أدخل تاريخًا ووقتًا صحيحين بتوقيت الرياض.", capacity: "يجب أن تكون السعة عددًا صحيحًا أكبر من صفر.",
  availability: "اختر حالة توفر صحيحة.", save: "تعذر حفظ الفعالية. حاول مرة أخرى.",
};

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="إدارة الفعاليات" title="فعالية جديدة" description="يُحفظ الإدخال كمسودة، ثم يمكنك نشره بإجراء مستقل." /><EventForm action={createEventAction} submitLabel="حفظ المسودة" errorMessage={error ? errors[error] : undefined} /></main>;
}
