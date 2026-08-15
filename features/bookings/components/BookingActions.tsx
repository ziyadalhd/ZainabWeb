"use client";

import { useActionState, useState } from "react";
import type { RegistrationAttendanceStatus, RegistrationStatus } from "@/lib/domain/types";
import type { BookingActionState } from "@/app/(public)/bookings/[token]/actions";

interface BookingActionsProps {
  attendanceStatus: RegistrationAttendanceStatus;
  status: RegistrationStatus;
  confirmAction: (state: BookingActionState) => Promise<BookingActionState>;
  cancelAction: (state: BookingActionState) => Promise<BookingActionState>;
}

export function BookingActions({
  attendanceStatus,
  status,
  confirmAction,
  cancelAction,
}: BookingActionsProps) {
  const [confirmState, confirmFormAction, confirming] = useActionState(confirmAction, {});
  const [cancelState, cancelFormAction, cancelling] = useActionState(cancelAction, {});
  const [confirmingCancellation, setConfirmingCancellation] = useState(false);

  if (cancelState.success === "cancelled") {
    return (
      <div role="status" className="notice-success">
        تم إلغاء الحجز وتحرير المقعد. أصبح هذا الرابط غير صالح.
      </div>
    );
  }

  const attendanceConfirmed = attendanceStatus === "confirmed" || confirmState.success === "confirmed";

  return (
    <div className="grid gap-4 border-t border-[var(--border)] pt-6">
      {status === "registered" && !attendanceConfirmed ? (
        <div className="grid gap-4">
          <p className="notice-warning text-sm leading-7">
            لا تؤكدي حضورك إلا إذا كنتِ متأكدة من الحضور، لأن هناك مشاركات في قائمة الانتظار.
          </p>
          <form action={confirmFormAction}>
            <button
              type="submit"
              disabled={confirming}
              className="button-primary min-h-12 w-full px-5 py-3"
            >
              {confirming ? "جارٍ التأكيد…" : "تأكيد الحضور"}
            </button>
          </form>
        </div>
      ) : null}

      {attendanceConfirmed ? (
        <p role="status" className="notice-success">
          تم تأكيد الحضور.
        </p>
      ) : null}

      {confirmState.error || cancelState.error ? (
        <p role="alert" className="notice-error">
          {confirmState.error === "unavailable" || cancelState.error === "unavailable"
            ? "لم يعد هذا الرابط متاحًا."
            : "تعذر تنفيذ الطلب. حاول مرة أخرى بعد قليل."}
        </p>
      ) : null}

      {!confirmingCancellation ? (
        <button
          type="button"
          onClick={() => setConfirmingCancellation(true)}
          className="button-danger min-h-12 px-5 py-3"
        >
          إلغاء الحجز
        </button>
      ) : (
        <div className="border border-[var(--color-error-text)] bg-[var(--color-error-bg)] p-4">
          <p className="font-bold">هل أنت متأكدة من إلغاء الحجز وتحرير المقعد؟</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <form action={cancelFormAction}>
              <button
                type="submit"
                disabled={cancelling}
                className="button-danger min-h-11 bg-[var(--color-error-text)] px-4 py-2 text-[var(--color-on-primary)]"
              >
                {cancelling ? "جارٍ الإلغاء…" : "نعم، إلغاء الحجز"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setConfirmingCancellation(false)}
              className="button-quiet min-h-11 px-4 py-2"
            >
              التراجع
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
