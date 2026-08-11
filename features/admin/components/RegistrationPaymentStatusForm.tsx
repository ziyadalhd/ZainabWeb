"use client";

import { useActionState } from "react";
import type { RegistrationPaymentActionState } from "@/app/(dashboard)/admin/(protected)/registrations/actions";
import type { RegistrationPaymentStatus } from "@/lib/domain/types";

export function RegistrationPaymentStatusForm({ action, currentStatus, registrationId }: {
  action: (state: RegistrationPaymentActionState, formData: FormData) => Promise<RegistrationPaymentActionState>;
  currentStatus: RegistrationPaymentStatus;
  registrationId: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="grid gap-2">
      <label className="sr-only" htmlFor={`registration-payment-${registrationId}`}>حالة الدفع</label>
      <select id={`registration-payment-${registrationId}`} name="paymentStatus" defaultValue={currentStatus} className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
        <option value="unpaid">غير مدفوع</option>
        <option value="deposit_paid">دُفعت العربون</option>
        <option value="paid_in_full">مدفوع بالكامل</option>
      </select>
      <button type="submit" disabled={pending} className="min-h-10 rounded-xl border border-[var(--brand-green)] px-3 py-2 text-sm font-extrabold text-[var(--brand-green-deep)] disabled:opacity-60">{pending ? "جارٍ الحفظ…" : "حفظ الدفع"}</button>
      {state.saved ? <span role="status" className="text-xs font-bold text-[var(--color-success-text)]">تم الحفظ.</span> : null}
      {state.error ? <span role="alert" className="text-xs font-bold text-[var(--color-error-text)]">تعذر الحفظ.</span> : null}
    </form>
  );
}
