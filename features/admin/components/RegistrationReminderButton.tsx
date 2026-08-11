"use client";

import Link from "next/link";
import { useActionState } from "react";
import type {
  MarkRegistrationReminderSentActionState,
  RegistrationReminderActionState,
} from "@/app/(dashboard)/admin/(protected)/registrations/actions";
import { formatArabicDateTime } from "@/lib/format/date";
import {
  buildRegistrationReminderMessage,
  buildWhatsAppMessageUrl,
} from "@/lib/messaging/registration-reminder";

interface RegistrationReminderButtonProps {
  attendeeName: string;
  eventTitle: string;
  phoneE164: string;
  latestPreparedAt: string | null;
  latestSentAt: string | null;
  prepareAction: (state: RegistrationReminderActionState) => Promise<RegistrationReminderActionState>;
  markSentAction: (
    id: string,
    state: MarkRegistrationReminderSentActionState,
  ) => Promise<MarkRegistrationReminderSentActionState>;
}

function MarkReminderSentControl({
  action,
}: {
  action: (
    state: MarkRegistrationReminderSentActionState,
  ) => Promise<MarkRegistrationReminderSentActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  if (state.sent) {
    return <p role="status" className="rounded-xl border border-[var(--brand-green)] px-3 py-2 text-center font-bold">سُجل أنها أُرسلت يدويًا</p>;
  }

  return (
    <form action={formAction} className="grid gap-2">
      {state.error ? <p role="alert" className="text-xs font-bold text-[var(--color-error-text)]">تعذر حفظ حالة الإرسال. حاولي مرة أخرى.</p> : null}
      <button type="submit" disabled={pending} className="w-full rounded-xl border border-[var(--brand-green)] px-3 py-2 font-bold text-[var(--brand-green)] disabled:opacity-65">
        {pending ? "جارٍ حفظ الحالة…" : "تم الإرسال يدويًا"}
      </button>
    </form>
  );
}

export function RegistrationReminderButton({
  attendeeName,
  eventTitle,
  phoneE164,
  latestPreparedAt,
  latestSentAt,
  prepareAction,
  markSentAction,
}: RegistrationReminderButtonProps) {
  const [state, formAction, pending] = useActionState(prepareAction, {});

  function openWhatsapp() {
    if (!state.managementPath) return;
    const managementUrl = new URL(state.managementPath, window.location.origin).href;
    const message = buildRegistrationReminderMessage({ attendeeName, eventTitle, managementUrl });
    window.open(buildWhatsAppMessageUrl(phoneE164, message), "_blank", "noopener,noreferrer");
  }

  if (state.managementPath && state.reminderId) {
    return (
      <div className="grid min-w-64 gap-2 rounded-xl bg-[var(--color-success-bg)] p-3 text-[var(--color-success-text)]">
        <p className="font-bold">التذكير جاهز لهذه المسجّلة</p>
        <p className="text-xs">{attendeeName} — <span dir="ltr">{phoneE164}</span></p>
        <Link className="break-all text-xs font-bold underline" href={state.managementPath}>فحص الرابط الآمن</Link>
        <button type="button" onClick={openWhatsapp} className="rounded-xl bg-[#1f7a3f] px-3 py-2 font-bold text-white">
          فتح الرسالة الجاهزة
        </button>
        <MarkReminderSentControl action={markSentAction.bind(null, state.reminderId)} />
        <p className="text-xs">فتح WhatsApp لا يعني الإرسال. اضغطي «تم الإرسال يدويًا» بعد إرسالها فعلًا.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {latestPreparedAt ? (
        <p className="text-xs font-bold muted-copy">
          {latestSentAt
            ? `آخر تذكير معلّم كمرسل: ${formatArabicDateTime(latestSentAt)}`
            : `آخر تذكير مجهز ولم يُعلّم كمرسل: ${formatArabicDateTime(latestPreparedAt)}`}
        </p>
      ) : null}
      {state.error ? <p role="alert" className="text-xs font-bold text-[var(--color-error-text)]">تعذر تجهيز التذكير. حدّثي الصفحة وحاولي مرة أخرى.</p> : null}
      <form action={formAction}>
        <button type="submit" disabled={pending} className="rounded-xl bg-[#1f7a3f] px-3 py-2 font-bold text-white disabled:opacity-65">
          {pending ? "جارٍ تجهيز الرابط…" : "تجهيز تذكير WhatsApp"}
        </button>
      </form>
    </div>
  );
}
