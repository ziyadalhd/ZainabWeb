"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { idleActionResult, type ActionResult } from "@/lib/data/action-result";

interface ConfirmDialogProps {
  triggerLabel: string;
  triggerClassName?: string;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: "danger" | "default";
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  successMessage: string;
  onSuccess?: () => void;
}

export function ConfirmDialog({
  triggerLabel,
  triggerClassName,
  title,
  description,
  confirmLabel = "تأكيد",
  tone = "danger",
  action,
  successMessage,
  onSuccess,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(action, idleActionResult);
  const { pushToast } = useToast();
  const headingId = useId();

  useEffect(() => {
    if (state.status === "success") {
      dialogRef.current?.close();
      pushToast(successMessage, "success");
      onSuccess?.();
    } else if (state.status === "error") {
      pushToast(state.message ?? "تعذر تنفيذ الإجراء. حاولي مرة أخرى.", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire only when the action result changes, not on every re-render from parent props
  }, [state]);

  return (
    <>
      <button
        type="button"
        className={triggerClassName ?? `${tone === "danger" ? "button-danger" : "button-secondary"} min-h-10 px-3 py-2 text-sm`}
        onClick={() => dialogRef.current?.showModal()}
      >
        {triggerLabel}
      </button>
      <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby={headingId}>
        <h2 id={headingId} className="text-lg font-black text-[var(--brand-forest)]">
          {title}
        </h2>
        <p className="mt-2 text-sm muted-copy">{description}</p>
        <form action={formAction} className="mt-5 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className={tone === "danger" ? "button-danger min-h-10 px-4 py-2 text-sm" : "button-primary min-h-10 px-4 py-2 text-sm"}
          >
            {pending ? "جارٍ التنفيذ…" : confirmLabel}
          </button>
          <button type="button" className="button-quiet min-h-10 px-4 py-2 text-sm" onClick={() => dialogRef.current?.close()}>
            تراجع
          </button>
        </form>
      </dialog>
    </>
  );
}
