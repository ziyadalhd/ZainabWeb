"use client";

import { useActionState } from "react";
import type { InvitationActionState } from "@/app/(public)/waitlist-invitations/[token]/actions";

export function WaitlistInvitationAction({
  action,
}: {
  action: (state: InvitationActionState) => Promise<InvitationActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  if (state.success) {
    return (
      <div role="status" className="rounded-2xl bg-[var(--color-success-bg)] p-5 font-bold text-[var(--color-success-text)]">
        تم قبول الدعوة وتأكيد المقعد. يمكنك إدارة الحجز من الرابط الذي ظهر عند تسجيلك الأول.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {state.error ? (
        <p role="alert" className="rounded-2xl bg-[var(--color-error-bg)] p-4 font-bold text-[var(--color-error-text)]">
          {state.error === "unavailable"
            ? "انتهت صلاحية الدعوة أو لم تعد متاحة."
            : "تعذر قبول الدعوة. حاول مرة أخرى بعد قليل."}
        </p>
      ) : null}
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-2xl bg-[var(--brand-green)] px-5 py-3 font-extrabold text-white disabled:opacity-65"
        >
          {pending ? "جارٍ قبول الدعوة…" : "قبول الدعوة وتأكيد المقعد"}
        </button>
      </form>
    </div>
  );
}
