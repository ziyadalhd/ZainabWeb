"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import type { DuplicateEventActionState } from "@/app/(dashboard)/admin/(protected)/events/actions";

export type DuplicateEventAction = (
  id: string,
  state: DuplicateEventActionState,
  formData: FormData,
) => Promise<DuplicateEventActionState>;

export function DuplicateEventButton({ eventId, action }: { eventId: string; action: DuplicateEventAction }) {
  const [state, formAction, pending] = useActionState(action.bind(null, eventId), { status: "idle" });
  const router = useRouter();
  const { pushToast } = useToast();

  useEffect(() => {
    if (state.status === "success" && state.eventId) {
      pushToast("تم إنشاء نسخة كمسودة جديدة. أكملي التاريخ قبل النشر.", "success");
      router.push(`/admin/events/${state.eventId}/edit`);
    } else if (state.status === "error") {
      pushToast("تعذر نسخ الفعالية. حاولي مرة أخرى.", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire only when the action result changes
  }, [state]);

  return (
    <form action={formAction}>
      <button type="submit" disabled={pending} className="button-secondary min-h-9 px-3 py-1.5 text-sm">
        {pending ? "جارٍ النسخ…" : "نسخ"}
      </button>
    </form>
  );
}
