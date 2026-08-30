"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { idleActionResult, type ActionResult } from "@/lib/data/action-result";
import { formatArabicNumber } from "@/lib/format/date";

export type DeleteEventAction = (id: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;

interface DeleteEventButtonProps {
  eventId: string;
  eventTitle: string;
  /** Seats currently held. Non-zero means the server will refuse the delete, so the dialog says so up front. */
  attendeeCount: number;
  action: DeleteEventAction;
  /** Where to land after a successful delete. Always a URL without `?event=`, so no stale panel reopens. */
  redirectTo?: string;
  triggerClassName?: string;
}

/**
 * A guarded destructive action: the trigger only opens a modal, and the delete itself is a second,
 * explicit confirmation inside it.
 *
 * When the event already has attendees the dialog does not offer a confirm button at all. The
 * server refuses that delete anyway (`registrations.event_id` is `on delete restrict`), so
 * presenting a button that is guaranteed to fail would be a worse answer than explaining why
 * cancellation is the route. The server stays authoritative either way: `attendeeCount` counts held
 * seats, and an event can also be undeletable because of cancelled registrations or feedback it
 * does not cover — that case comes back as an error toast.
 */
export function DeleteEventButton({
  eventId,
  eventTitle,
  attendeeCount,
  action,
  redirectTo = "/admin/events",
  triggerClassName = "button-danger min-h-9 px-3 py-1.5 text-sm",
}: DeleteEventButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(action.bind(null, eventId), idleActionResult);
  const router = useRouter();
  const { pushToast } = useToast();
  const headingId = useId();
  const blocked = attendeeCount > 0;

  useEffect(() => {
    if (state.status === "success") {
      dialogRef.current?.close();
      pushToast(`تم حذف «${eventTitle}» نهائيًا.`, "success");
      router.push(redirectTo);
      router.refresh();
    } else if (state.status === "error") {
      pushToast(state.message ?? "تعذر حذف الفعالية. حاولي مرة أخرى.", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire only when the action result changes
  }, [state]);

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => dialogRef.current?.showModal()}>
        حذف الفعالية
      </button>
      <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby={headingId}>
        <h2 id={headingId} className="text-lg font-bold text-[var(--brand-forest)]">
          حذف الفعالية
        </h2>
        {blocked ? (
          <div className="notice-error mt-3 p-4 text-sm" role="alert">
            <p className="font-bold">لا يمكن حذف هذه الفعالية</p>
            <p className="mt-2">
              يوجد {formatArabicNumber(attendeeCount)} مقعدًا محجوزًا في «{eventTitle}». حذف الفعالية سيمحو سجلات المسجلات
              وبيانات الدفع المرتبطة بها، ولهذا فهو غير متاح.
            </p>
            <p className="mt-2">ألغي الفعالية بدلًا من ذلك: الإلغاء يحتفظ بالسجلات ويتيح لك إشعار المسجلات.</p>
          </div>
        ) : (
          <p className="mt-2 text-sm muted-copy">
            سيُحذف «{eventTitle}» نهائيًا مع بوسترها وقالب التذكير الخاص بها. لا يمكن التراجع عن هذا الإجراء.
          </p>
        )}
        <form action={formAction} className="mt-5 flex flex-wrap gap-2">
          {blocked ? null : (
            <button type="submit" disabled={pending} className="button-danger min-h-10 px-4 py-2 text-sm">
              {pending ? "جارٍ الحذف…" : "تأكيد الحذف نهائيًا"}
            </button>
          )}
          <button type="button" className="button-quiet min-h-10 px-4 py-2 text-sm" onClick={() => dialogRef.current?.close()}>
            {blocked ? "إغلاق" : "تراجع"}
          </button>
        </form>
      </dialog>
    </>
  );
}
