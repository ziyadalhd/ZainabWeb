"use client";

import { useActionState, useEffect, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { idleActionResult, type ActionResult } from "@/lib/data/action-result";

interface ConfirmActionFormProps {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  label: string;
  confirmation: string;
  successMessage: string;
  tone?: "danger" | "quiet";
  onSuccess?: () => void;
}

export function ConfirmActionForm({ action, label, confirmation, successMessage, tone = "danger", onSuccess }: ConfirmActionFormProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, idleActionResult);
  const [handledState, setHandledState] = useState(state);
  const { pushToast } = useToast();

  if (state !== handledState) {
    setHandledState(state);
    if (state.status === "success") setConfirming(false);
  }

  useEffect(() => {
    if (state.status === "success") {
      pushToast(successMessage, "success");
      onSuccess?.();
    } else if (state.status === "error") {
      pushToast(state.message ?? "تعذر تنفيذ الإجراء. حاولي مرة أخرى.", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire only when the action result changes
  }, [state]);

  if (!confirming) {
    return (
      <button
        type="button"
        className={`${tone === "danger" ? "button-danger" : "button-quiet"} min-h-10 px-3 py-2 text-sm`}
        onClick={() => setConfirming(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <form action={formAction} className="admin-confirm-action" aria-label={`تأكيد ${label}`}>
      <p className="text-sm font-bold">{confirmation}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className={`${tone === "danger" ? "button-danger" : "button-secondary"} min-h-10 px-3 py-2 text-sm`}
        >
          {pending ? "جارٍ التنفيذ…" : "تأكيد"}
        </button>
        <button type="button" className="button-quiet min-h-10 px-3 py-2 text-sm" onClick={() => setConfirming(false)}>
          تراجع
        </button>
      </div>
    </form>
  );
}
