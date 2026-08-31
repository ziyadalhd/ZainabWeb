"use client";

import { useTransition } from "react";
import type { Registration } from "@/lib/domain/types";
import { idleActionResult } from "@/lib/data/action-result";
import type { RegistrationTableActions } from "@/features/admin/components/RegistrationTable";

/**
 * A labelled on/off switch. Writing happens on the toggle itself — there is no submit step and no
 * save button, because both of the states it writes are one field with two values and either one is
 * as easy to set again as it was to set the first time.
 */
function Switch({ on, onLabel, offLabel, name, disabled, onToggle }: {
  on: boolean;
  onLabel: string;
  offLabel: string;
  name: string;
  disabled: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={name}
      disabled={disabled}
      onClick={() => onToggle(!on)}
      className={on ? "registration-switch registration-switch--on" : "registration-switch"}
    >
      <span className="registration-switch__track" aria-hidden="true">
        <span className="registration-switch__thumb" />
      </span>
      <span className="registration-switch__label">{on ? onLabel : offLabel}</span>
    </button>
  );
}

/**
 * The roster's whole action surface: two instant switches and one destructive option behind a menu.
 *
 * This replaces four buttons that overlapped and sometimes disagreed — `تأكيد الحضور` (an
 * intermediate attendance status that changed nothing downstream), `تسجيل الحضور`, `تسجيل الغياب`,
 * and a payment `<select>` with its own save button. Attendance is one question with two answers,
 * and so is payment; both are now shaped that way.
 */
export function RegistrationQuickToggles({ registration, actions }: { registration: Registration; actions: RegistrationTableActions }) {
  const [pending, startTransition] = useTransition();
  const checkedIn = registration.checkInStatus === "checked_in";
  const paid = registration.paymentStatus === "paid_in_full";

  function toggleCheckIn(next: boolean) {
    startTransition(async () => {
      await actions.recordCheckIn(registration.id, next ? "checked_in" : "absent", idleActionResult, new FormData());
    });
  }

  function togglePayment(next: boolean) {
    const formData = new FormData();
    formData.set("paymentStatus", next ? "paid_in_full" : "unpaid");
    startTransition(async () => {
      await actions.setPaymentStatus(registration.id, {}, formData);
    });
  }

  return (
    <div className="registration-toggles">
      <Switch on={checkedIn} onLabel="حضر" offLabel="لم يحضر" name="الحضور" disabled={pending} onToggle={toggleCheckIn} />
      <div className="registration-toggles__payment">
        <Switch on={paid} onLabel="مدفوع" offLabel="غير مدفوع" name="الدفع" disabled={pending} onToggle={togglePayment} />
        {registration.paymentStatus === "deposit_paid" ? (
          // A seat that settled a deposit is neither of the switch's two states; saying so is more
          // honest than rendering a recorded payment as if nothing had been paid.
          <span className="registration-toggles__chip">دُفع العربون</span>
        ) : null}
      </div>
    </div>
  );
}
