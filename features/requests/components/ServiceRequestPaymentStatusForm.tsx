"use client";

import { useActionState } from "react";
import type { ServiceRequestPaymentActionState } from "@/app/(dashboard)/admin/(protected)/requests/actions";
import type { ServiceRequestPaymentStatus } from "@/lib/domain/types";

interface ServiceRequestPaymentStatusFormProps {
  action: (state: ServiceRequestPaymentActionState, formData: FormData) => Promise<ServiceRequestPaymentActionState>;
  currentStatus: ServiceRequestPaymentStatus;
}
export function ServiceRequestPaymentStatusForm({ action, currentStatus }: ServiceRequestPaymentStatusFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <label className="grid gap-2 text-sm font-bold" htmlFor="request-payment-status">
        حالة الدفع (تسجيل يدوي)
        <select id="request-payment-status" name="paymentStatus" className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2" defaultValue={currentStatus}>
          <option value="unpaid">غير مدفوع</option>
          <option value="deposit_paid">دُفعت العربون</option>
          <option value="paid_in_full">مدفوع بالكامل</option>
        </select>
      </label>
      <button type="submit" disabled={pending} className="min-h-11 rounded-xl border border-[var(--brand-green)] px-4 py-2 text-sm font-extrabold text-[var(--brand-green-deep)] disabled:opacity-60">{pending ? "جارٍ الحفظ…" : "حفظ حالة الدفع"}</button>
      {state.saved ? <p role="status" className="text-sm font-bold text-[var(--color-success-text)]">تم الحفظ.</p> : null}
      {state.error ? <p role="alert" className="text-sm font-bold text-[var(--color-error-text)]">تعذر حفظ حالة الدفع الآن.</p> : null}
    </form>
  );
}
