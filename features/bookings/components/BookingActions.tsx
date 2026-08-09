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
      <div role="status" className="rounded-2xl bg-[var(--color-success-bg)] p-4 font-bold text-[var(--color-success-text)]">
        تم إلغاء الحجز وتحرير المقعد. أصبح هذا الرابط غير صالح.
      </div>
    );
  }

  const attendanceConfirmed = attendanceStatus === "confirmed" || confirmState.success === "confirmed";

  return (
    <div className="grid gap-4 border-t border-[var(--border)] pt-6">
      {status === "registered" && !attendanceConfirmed ? (
        <form action={confirmFormAction}>
          <button
            type="submit"
            disabled={confirming}
            className="min-h-12 w-full rounded-2xl bg-[var(--brand-green)] px-5 py-3 font-extrabold text-white disabled:opacity-65"
          >
            {confirming ? "جارٍ التأكيد…" : "تأكيد الحضور"}
          </button>
        </form>
      ) : null}

      {attendanceConfirmed ? (
        <p role="status" className="rounded-2xl bg-[var(--color-success-bg)] p-4 font-bold text-[var(--color-success-text)]">
          تم تأكيد الحضور.
        </p>
      ) : null}

      {confirmState.error || cancelState.error ? (
        <p role="alert" className="rounded-2xl bg-[var(--color-error-bg)] p-4 font-bold text-[var(--color-error-text)]">
          {confirmState.error === "unavailable" || cancelState.error === "unavailable"
            ? "لم يعد هذا الرابط متاحًا."
            : "تعذر تنفيذ الطلب. حاول مرة أخرى بعد قليل."}
        </p>
      ) : null}

      {!confirmingCancellation ? (
        <button
          type="button"
          onClick={() => setConfirmingCancellation(true)}
          className="min-h-12 rounded-2xl border border-[var(--color-error-text)] px-5 py-3 font-extrabold text-[var(--color-error-text)]"
        >
          إلغاء الحجز
        </button>
      ) : (
        <div className="rounded-2xl border border-[var(--color-error-text)] p-4">
          <p className="font-bold">هل أنت متأكدة من إلغاء الحجز وتحرير المقعد؟</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <form action={cancelFormAction}>
              <button
                type="submit"
                disabled={cancelling}
                className="min-h-11 rounded-xl bg-[var(--color-error-text)] px-4 py-2 font-extrabold text-white disabled:opacity-65"
              >
                {cancelling ? "جارٍ الإلغاء…" : "نعم، إلغاء الحجز"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setConfirmingCancellation(false)}
              className="min-h-11 rounded-xl border border-[var(--border)] px-4 py-2 font-bold"
            >
              التراجع
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
