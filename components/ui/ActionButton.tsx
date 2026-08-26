"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { idleActionResult, type ActionResult } from "@/lib/data/action-result";

interface ActionButtonProps {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  label: string;
  pendingLabel?: string;
  className?: string;
  successMessage: string;
  onSuccess?: () => void;
}

export function ActionButton({ action, label, pendingLabel, className, successMessage, onSuccess }: ActionButtonProps) {
  const [state, formAction, pending] = useActionState(action, idleActionResult);
  const { pushToast } = useToast();

  useEffect(() => {
    if (state.status === "success") {
      pushToast(successMessage, "success");
      onSuccess?.();
    } else if (state.status === "error") {
      pushToast(state.message ?? "تعذر تنفيذ الإجراء. حاولي مرة أخرى.", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire only when the action result changes
  }, [state]);

  return (
    <form action={formAction}>
      <button type="submit" disabled={pending} className={className ?? "button-quiet w-full text-right text-sm"}>
        {pending ? (pendingLabel ?? "جارٍ التنفيذ…") : label}
      </button>
    </form>
  );
}
