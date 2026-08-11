"use client";

import { useActionState } from "react";
import type { ServiceRequestOfferActionState } from "@/app/(dashboard)/admin/(protected)/requests/actions";
import { formatRiyadhDateTimeLocal } from "@/lib/format/date";

interface ServiceRequestOfferFormProps {
  action: (state: ServiceRequestOfferActionState, formData: FormData) => Promise<ServiceRequestOfferActionState>;
  priceHalalas: number | null;
  terms: string | null;
  expiresAt: string | null;
}

const inputClassName = "min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]";

function formatPrice(priceHalalas: number | null): string {
  if (priceHalalas === null) return "";
  const whole = Math.floor(priceHalalas / 100);
  const fraction = priceHalalas % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, "0")}`;
}

export function ServiceRequestOfferForm({ action, priceHalalas, terms, expiresAt }: ServiceRequestOfferFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const errorMessage = state.error === "price"
    ? "أدخلي سعرًا صحيحًا بالريال، ويمكن إدخال 0."
    : state.error === "terms"
      ? "أدخلي شروط العرض."
      : state.error === "expiresAt"
        ? "اختاري وقت صلاحية لاحقًا بتوقيت السعودية."
        : state.error === "save"
          ? "تعذر حفظ العرض الآن."
          : null;

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4" noValidate>
      <div>
        <h3 className="font-extrabold text-[var(--brand-green-deep)]">صياغة عرض للطلب</h3>
        <p className="mt-1 text-xs muted-copy">سيظهر العرض لصاحبة الطلب عبر رابط المتابعة الآمن. لا يتم تحصيل أي مبلغ من الموقع.</p>
      </div>
      {errorMessage ? <p role="alert" className="rounded-xl bg-[var(--color-error-bg)] px-3 py-2 text-sm font-bold text-[var(--color-error-text)]">{errorMessage}</p> : null}
      {state.saved ? <p role="status" className="rounded-xl bg-[var(--color-success-bg)] px-3 py-2 text-sm font-bold text-[var(--color-success-text)]">تم حفظ العرض. سيظهر الآن من رابط متابعة الطلب.</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold" htmlFor="offer-price">
          السعر بالريال السعودي
          <input id="offer-price" className={inputClassName} name="priceSar" inputMode="decimal" dir="ltr" defaultValue={formatPrice(priceHalalas)} placeholder="0" required />
        </label>
        <label className="grid gap-2 text-sm font-bold" htmlFor="offer-expiry">
          صالح حتى (بتوقيت السعودية)
          <input id="offer-expiry" className={inputClassName} name="expiresAt" type="datetime-local" defaultValue={expiresAt ? formatRiyadhDateTimeLocal(expiresAt) : undefined} />
          <span className="text-xs font-normal muted-copy">اتركيه فارغًا لصلاحية 48 ساعة.</span>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-bold" htmlFor="offer-terms">
        شروط العرض
        <textarea id="offer-terms" className={inputClassName} name="terms" rows={4} maxLength={4000} defaultValue={terms ?? ""} required />
      </label>
      <button type="submit" disabled={pending} className="min-h-11 w-fit rounded-xl bg-[var(--brand-green)] px-4 py-2 text-sm font-extrabold text-white disabled:cursor-wait disabled:opacity-60">{pending ? "جارٍ حفظ العرض…" : priceHalalas === null ? "إرسال العرض للرابط الآمن" : "تحديث العرض"}</button>
    </form>
  );
}
