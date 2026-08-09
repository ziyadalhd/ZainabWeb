"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { WaitlistInviteActionState } from "@/app/(dashboard)/admin/(protected)/registrations/actions";

interface WaitlistInviteButtonProps {
  attendeeName: string;
  eventTitle: string;
  action: (state: WaitlistInviteActionState) => Promise<WaitlistInviteActionState>;
}

export function WaitlistInviteButton({
  attendeeName,
  eventTitle,
  action,
}: WaitlistInviteButtonProps) {
  const [state, formAction, pending] = useActionState(action, {});

  function openWhatsapp() {
    if (!state.invitationPath) return;
    const invitationUrl = new URL(state.invitationPath, window.location.origin).href;
    const message = `السلام عليكم ${attendeeName}، توفر مقعد في فعالية ${eventTitle}. الدعوة صالحة لمدة 6 ساعات، ويمكن قبولها من الرابط: ${invitationUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  if (state.invitationPath) {
    return (
      <div className="grid gap-2 rounded-xl bg-[var(--color-success-bg)] p-3 text-[var(--color-success-text)]">
        <p className="font-bold">أُنشئت الدعوة لمدة 6 ساعات.</p>
        <Link className="break-all text-xs font-bold underline" href={state.invitationPath}>فتح رابط الدعوة</Link>
        <button type="button" onClick={openWhatsapp} className="rounded-xl bg-[#1f7a3f] px-3 py-2 font-bold text-white">
          فتح رسالة WhatsApp
        </button>
        <p className="text-xs">فتح WhatsApp لا يعني أن الرسالة أُرسلت؛ تحققي منها وأرسليها يدويًا.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {state.error ? <p role="alert" className="text-xs font-bold text-[var(--color-error-text)]">تعذر إنشاء الدعوة. تأكدي من توفر مقعد ثم حاولي مرة أخرى.</p> : null}
      <form action={formAction}>
        <button type="submit" disabled={pending} className="rounded-xl bg-[var(--brand-green)] px-3 py-2 font-bold text-white disabled:opacity-65">
          {pending ? "جارٍ إنشاء الدعوة…" : "اختيار وإصدار دعوة"}
        </button>
      </form>
    </div>
  );
}
