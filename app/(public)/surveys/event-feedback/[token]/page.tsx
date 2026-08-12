import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { submitEventFeedbackAction } from "@/app/(public)/surveys/event-feedback/[token]/actions";
import { EventFeedbackForm } from "@/features/surveys/components/EventFeedbackForm";
import { createEventFeedbackService } from "@/lib/supabase/event-feedback";

export const metadata: Metadata = { title: "تقييم الفعالية" };
export const dynamic = "force-dynamic";

export default async function EventFeedbackTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const service = await createEventFeedbackService();
  const survey = await service.getByToken(token);
  if (!survey) notFound();

  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="استبيان فعالية" title={`تقييم ${survey.eventTitle}`} description="نشكرك على وقتك. هذا الرابط يقبل استجابة واحدة فقط." />
      <div className="max-w-2xl"><EventFeedbackForm action={submitEventFeedbackAction.bind(null, token)} /></div>
    </main>
  );
}
