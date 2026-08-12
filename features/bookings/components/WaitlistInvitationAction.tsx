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
      <div role="status" className="notice-success p-5">
        تم قبول الدعوة وتأكيد المقعد. يمكنك إدارة الحجز من الرابط الذي ظهر عند تسجيلك الأول.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {state.error ? (
        <p role="alert" className="notice-error">
          {state.error === "unavailable"
            ? "انتهت صلاحية الدعوة أو لم تعد متاحة."
            : "تعذر قبول الدعوة. حاول مرة أخرى بعد قليل."}
        </p>
      ) : null}
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="button-primary min-h-12 w-full px-5 py-3"
        >
          {pending ? "جارٍ قبول الدعوة…" : "قبول الدعوة وتأكيد المقعد"}
        </button>
      </form>
    </div>
  );
}
