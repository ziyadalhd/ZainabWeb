"use client";

import { useActionState } from "react";
import type { ServiceRequestOfferActionState } from "@/app/(dashboard)/admin/(protected)/requests/actions";
import { formatRiyadhDateTimeLocal } from "@/lib/format/date";
import { OptionalDateTimePicker } from "@/features/scheduling/components/OptionalDateTimePicker";

interface ServiceRequestOfferFormProps {
  action: (state: ServiceRequestOfferActionState, formData: FormData) => Promise<ServiceRequestOfferActionState>;
  priceHalalas: number | null;
  terms: string | null;
  expiresAt: string | null;
}

const inputClassName = "field-control min-h-11 px-3 py-2";

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
    <form action={formAction} className="grid gap-4 border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4" noValidate>
      <div>
        <h3 className="font-extrabold text-[var(--brand-green-deep)]">صياغة عرض للطلب</h3>
        <p className="mt-1 text-xs muted-copy">سيظهر العرض لصاحبة الطلب في صفحة متابعة طلبها. لا يتم تحصيل أي مبلغ من الموقع.</p>
      </div>
      {errorMessage ? <p role="alert" className="notice-error text-sm">{errorMessage}</p> : null}
      {state.saved ? <p role="status" className="notice-success text-sm">تم حفظ العرض. سيظهر الآن من رابط متابعة الطلب.</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold" htmlFor="offer-price">
          السعر بالريال السعودي
          <input id="offer-price" className={inputClassName} name="priceSar" inputMode="decimal" dir="ltr" defaultValue={formatPrice(priceHalalas)} placeholder="0" required />
        </label>
        <div className="grid gap-2 text-sm font-bold">
          صالح حتى (بتوقيت السعودية)
          <OptionalDateTimePicker name="expiresAt" defaultValue={expiresAt ? formatRiyadhDateTimeLocal(expiresAt) : undefined} />
          <span className="text-xs font-normal muted-copy">اتركيه فارغًا لصلاحية 48 ساعة.</span>
        </div>
      </div>
      <label className="grid gap-2 text-sm font-bold" htmlFor="offer-terms">
        شروط العرض
        <textarea id="offer-terms" className={inputClassName} name="terms" rows={4} maxLength={4000} defaultValue={terms ?? ""} required />
      </label>
      <button type="submit" disabled={pending} className="button-primary w-fit px-4 py-2 text-sm">{pending ? "جارٍ حفظ العرض…" : priceHalalas === null ? "حفظ العرض وإتاحته لصاحبة الطلب" : "تحديث العرض"}</button>
    </form>
  );
}
