"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { EventFeedbackLinkActionState } from "@/app/(dashboard)/admin/(protected)/registrations/actions";

export function RegistrationFeedbackButton({
  attendeeName,
  eventTitle,
  phoneE164,
  action,
}: {
  attendeeName: string;
  eventTitle: string;
  phoneE164: string;
  action: (state: EventFeedbackLinkActionState) => Promise<EventFeedbackLinkActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  if (state.feedbackPath) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${origin}${state.feedbackPath}`;
    const message = `السلام عليكم ${attendeeName}، نشكركِ على حضور فعالية «${eventTitle}» في نادي بَيْن الثقافي. يهمنا رأيكِ لتطوير تجاربنا القادمة عبر هذا الرابط: ${fullUrl}`;
    const whatsappUrl = `https://wa.me/${phoneE164.replace("+", "")}?text=${encodeURIComponent(message)}`;

    return (
      <div className="notice-success grid gap-2 p-3">
        <p className="text-xs font-bold">رابط تقييم الفعالية جاهز لمرة واحدة.</p>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button-primary min-h-8 px-3 py-1.5 text-xs font-bold"
          >
            إرسال التقييم عبر WhatsApp
          </a>
          <Link href={state.feedbackPath} className="break-all text-xs font-bold underline">
            فحص الرابط
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-2">
      {state.error ? <p role="alert" className="text-xs font-bold text-[var(--color-error-text)]">تعذر تجهيز الرابط. حدّثي الصفحة وحاولي مرة أخرى.</p> : null}
      <button type="submit" disabled={pending} className="button-secondary px-3 py-2 text-sm">
        {pending ? "جارٍ تجهيز الرابط…" : "تجهيز رابط تقييم"}
      </button>
    </form>
  );
}
