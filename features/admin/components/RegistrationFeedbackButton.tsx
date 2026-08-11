"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { EventFeedbackLinkActionState } from "@/app/(dashboard)/admin/(protected)/registrations/actions";

export function RegistrationFeedbackButton({
  action,
}: {
  action: (state: EventFeedbackLinkActionState) => Promise<EventFeedbackLinkActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  if (state.feedbackPath) {
    return (
      <div className="grid gap-2 rounded-xl bg-[var(--color-success-bg)] p-3 text-[var(--color-success-text)]">
        <p className="text-xs font-bold">رابط تقييم الفعالية جاهز لمرة واحدة.</p>
        <Link href={state.feedbackPath} className="break-all text-xs font-bold underline">فحص الرابط الآمن</Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-2">
      {state.error ? <p role="alert" className="text-xs font-bold text-[var(--color-error-text)]">تعذر تجهيز الرابط. حدّثي الصفحة وحاولي مرة أخرى.</p> : null}
      <button type="submit" disabled={pending} className="rounded-xl border border-[var(--brand-green)] px-3 py-2 font-bold text-[var(--brand-green)] disabled:opacity-65">
        {pending ? "جارٍ تجهيز الرابط…" : "تجهيز رابط تقييم"}
      </button>
    </form>
  );
}
