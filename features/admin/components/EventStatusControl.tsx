"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { idleActionResult, type ActionResult } from "@/lib/data/action-result";
import type { Event, EventPublicationStatus } from "@/lib/domain/types";

export type EventStatusAction = (
  id: string,
  requestedStatus: EventPublicationStatus,
  state: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

interface StatusTransition {
  status: EventPublicationStatus;
  label: string;
  tone: "primary" | "secondary" | "quiet" | "danger";
  successMessage: string;
  /** Present for a transition the admin has to confirm; rendered inline, not in a dialog. */
  confirmation?: (event: Event) => string;
}

const transitionsByStatus: Record<EventPublicationStatus, readonly StatusTransition[]> = {
  draft: [
    { status: "published", label: "نشر", tone: "primary", successMessage: "تم نشر الفعالية." },
    {
      status: "archived",
      label: "أرشفة",
      tone: "quiet",
      successMessage: "تم أرشفة الفعالية.",
      confirmation: (event) => `أرشفة «${event.title}»؟ ستختفي من الموقع العام.`,
    },
  ],
  published: [
    {
      status: "cancelled",
      label: "إلغاء",
      tone: "danger",
      successMessage: "تم إلغاء الفعالية.",
      confirmation: (event) => `إلغاء «${event.title}»؟ ستتوقف التسجيلات وتبقى الفعالية في السجل.`,
    },
    {
      status: "archived",
      label: "أرشفة",
      tone: "quiet",
      successMessage: "تم أرشفة الفعالية.",
      confirmation: (event) => `أرشفة «${event.title}»؟ ستختفي من الموقع العام.`,
    },
  ],
  archived: [{ status: "draft", label: "إعادة إلى مسودة", tone: "secondary", successMessage: "تمت إعادة الفعالية إلى مسودة." }],
  cancelled: [],
};

const toneClass: Record<StatusTransition["tone"], string> = {
  primary: "button-primary",
  secondary: "button-secondary",
  quiet: "button-quiet",
  danger: "button-danger",
};

/**
 * Every publication-status transition, in one always-mounted control.
 *
 * The status it renders from is optimistic: a click flips the badge and the available transitions
 * in the same frame, and the server action runs inside that same transition. Nothing here reads a
 * `useActionState` pending flag, which is what used to strand the old buttons on "جارٍ التنفيذ…" —
 * that flag stays true until the transition commits, and a Server Action that calls
 * `revalidatePath` on this `force-dynamic` route makes committing wait on every suspending
 * boundary the page has (the list body and, when the panel is open, the whole event workspace).
 *
 * Because the optimistic re-render can unmount the very button that was clicked, the toast and the
 * `router.refresh()` are issued from here rather than from the button. The refresh runs inside the
 * transition so the optimistic status stays applied until the real data lands, with no flicker in
 * between. A failed action rolls the status back on its own and toasts the server's reason.
 */
export function EventStatusControl({
  event,
  action,
  layout = "row",
}: {
  event: Event;
  action: EventStatusAction;
  /** "row" for the compact event card; "stack" for the inspector's settings panel. */
  layout?: "row" | "stack";
}) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(event.publicationStatus);
  const [confirming, setConfirming] = useState<EventPublicationStatus | null>(null);

  const readyToPublish = event.endsAt !== null && event.priceHalalas !== null;

  function run(transition: StatusTransition) {
    setConfirming(null);
    startTransition(async () => {
      setOptimisticStatus(transition.status);
      const result = await action(event.id, transition.status, idleActionResult, new FormData());
      if (result.status === "success") {
        pushToast(transition.successMessage, "success");
        router.refresh();
      } else {
        pushToast(result.message ?? "تعذر تغيير حالة الفعالية. حاولي مرة أخرى.", "error");
      }
    });
  }

  if (optimisticStatus === "cancelled") return <p className="text-xs muted-copy">الإلغاء حالة نهائية.</p>;

  const pending = confirming ? transitionsByStatus[optimisticStatus].find((transition) => transition.status === confirming) : undefined;
  if (pending?.confirmation) {
    return (
      <div className="event-status-control__confirm" role="group" aria-label={`تأكيد ${pending.label}`}>
        <p className="text-sm font-normal">{pending.confirmation(event)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={`${toneClass[pending.tone]} min-h-10 px-3 py-2 text-sm`} onClick={() => run(pending)}>
            تأكيد {pending.label}
          </button>
          <button type="button" className="button-quiet min-h-10 px-3 py-2 text-sm" onClick={() => setConfirming(null)}>
            تراجع
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={layout === "stack" ? "event-status-control event-status-control--stack" : "event-status-control"}>
      {transitionsByStatus[optimisticStatus].map((transition) => {
        if (transition.status === "published" && !readyToPublish) {
          return (
            <Link
              key={transition.status}
              href={`/admin/events/${event.id}/edit`}
              className="button-secondary min-h-9 px-3 py-1.5 text-sm"
              title="يلزم إكمال وقت النهاية والسعر قبل النشر"
            >
              أكملي البيانات للنشر
            </Link>
          );
        }
        return (
          <button
            key={transition.status}
            type="button"
            className={`${toneClass[transition.tone]} min-h-9 px-3 py-1.5 text-sm`}
            onClick={() => (transition.confirmation ? setConfirming(transition.status) : run(transition))}
          >
            {transition.label}
          </button>
        );
      })}
    </div>
  );
}
