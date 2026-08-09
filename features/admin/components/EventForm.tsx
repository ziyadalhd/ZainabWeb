"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Event } from "@/lib/domain/types";
import {
  formatRiyadhDateInput,
  formatRiyadhTimeInput,
} from "@/lib/format/date";
import type {
  EventFormActionError,
  EventFormActionState,
} from "@/app/(dashboard)/admin/(protected)/events/actions";

interface EventFormProps {
  action: (
    state: EventFormActionState,
    formData: FormData,
  ) => Promise<EventFormActionState>;
  event?: Event;
  submitLabel: string;
}

const errorMessages: Record<EventFormActionError, string> = {
  title: "أدخل عنوانًا للفعالية.",
  audience: "اختر فئة صحيحة.",
  eventTypeLabel: "أدخل نوع الفعالية.",
  startsAt: "أدخل تاريخ البداية ووقتها بتوقيت السعودية.",
  endsAt: "يجب أن تكون نهاية الفعالية بعد بدايتها.",
  capacity: "أدخل سعة صحيحة من 1 إلى 50 مقعدًا.",
  priceHalalas: "أدخل سعرًا صحيحًا بالريال، أو 0 للفعالية المجانية.",
  registrationStatus: "تعذر تحديد حالة التسجيل.",
  save: "تعذر حفظ الفعالية. لم تُفقد البيانات؛ حاول مرة أخرى.",
};

const fieldForError: Partial<Record<EventFormActionError, string>> = {
  title: "title",
  audience: "audience",
  eventTypeLabel: "eventTypeLabel",
  startsAt: "startDate",
  endsAt: "endDate",
  capacity: "capacity",
  priceHalalas: "priceSar",
};

const inputClassName =
  "min-h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] shadow-sm transition-[border-color,box-shadow] hover:border-[var(--color-brand-green)]";

function formatPriceInput(priceHalalas: number | null | undefined): string {
  if (priceHalalas === null || priceHalalas === undefined) return "";
  const whole = Math.floor(priceHalalas / 100);
  const fraction = priceHalalas % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, "0")}`;
}

export function EventForm({ action, event, submitLabel }: EventFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fallbackEnd = event?.endsAt ?? null;

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeUnload = (browserEvent: BeforeUnloadEvent) => {
      browserEvent.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!state.error) return;
    const fieldName = fieldForError[state.error];
    if (!fieldName) return;
    formRef.current
      ?.querySelector<HTMLElement>(`[name="${fieldName}"]`)
      ?.focus();
  }, [state.error]);

  const fieldError = (field: EventFormActionError) =>
    state.error === field ? (
      <span className="text-sm font-bold text-[var(--color-error-text)]">
        {errorMessages[field]}
      </span>
    ) : null;

  return (
    <form
      ref={formRef}
      action={formAction}
      onChange={() => setDirty(true)}
      className="mt-8 grid max-w-4xl gap-8 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-8"
      noValidate
    >
      {state.error === "save" || state.error === "registrationStatus" ? (
        <p
          role="alert"
          className="rounded-2xl bg-[var(--color-error-bg)] px-4 py-3 font-bold text-[var(--color-error-text)]"
        >
          {errorMessages[state.error]}
        </p>
      ) : null}

      <fieldset className="grid gap-5">
        <legend className="text-xl font-extrabold text-[var(--brand-green-deep)]">
          المعلومات الأساسية
        </legend>
        <label className="grid gap-2 font-bold" htmlFor="event-title">
          عنوان الفعالية
          <input
            id="event-title"
            className={inputClassName}
            name="title"
            defaultValue={event?.title}
            autoComplete="off"
            maxLength={140}
            required
          />
          {fieldError("title")}
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 font-bold" htmlFor="event-audience">
            الفئة
            <select
              id="event-audience"
              className={inputClassName}
              name="audience"
              defaultValue={event?.audience ?? "adults"}
            >
              <option value="adults">الكبار</option>
              <option value="youth">اليافعون</option>
              <option value="children">الصغار</option>
            </select>
            {fieldError("audience")}
          </label>
          <label className="grid gap-2 font-bold" htmlFor="event-type">
            نوع الفعالية
            <input
              id="event-type"
              className={inputClassName}
              name="eventTypeLabel"
              defaultValue={event?.eventTypeLabel}
              autoComplete="off"
              maxLength={100}
              required
            />
            {fieldError("eventTypeLabel")}
          </label>
        </div>
      </fieldset>

      <fieldset className="grid gap-5 border-t border-[var(--border)] pt-7">
        <legend className="text-xl font-extrabold text-[var(--brand-green-deep)]">
          الموعد بتوقيت السعودية
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 font-bold" htmlFor="event-start-date">
            تاريخ البداية
            <input
              id="event-start-date"
              className={inputClassName}
              type="date"
              name="startDate"
              dir="ltr"
              defaultValue={event ? formatRiyadhDateInput(event.startsAt) : undefined}
              required
            />
            {fieldError("startsAt")}
          </label>
          <label className="grid gap-2 font-bold" htmlFor="event-start-time">
            وقت البداية
            <input
              id="event-start-time"
              className={inputClassName}
              type="time"
              name="startTime"
              dir="ltr"
              defaultValue={event ? formatRiyadhTimeInput(event.startsAt) : undefined}
              required
            />
          </label>
          <label className="grid gap-2 font-bold" htmlFor="event-end-date">
            تاريخ النهاية
            <input
              id="event-end-date"
              className={inputClassName}
              type="date"
              name="endDate"
              dir="ltr"
              defaultValue={fallbackEnd ? formatRiyadhDateInput(fallbackEnd) : undefined}
              required
            />
            {fieldError("endsAt")}
          </label>
          <label className="grid gap-2 font-bold" htmlFor="event-end-time">
            وقت النهاية
            <input
              id="event-end-time"
              className={inputClassName}
              type="time"
              name="endTime"
              dir="ltr"
              defaultValue={fallbackEnd ? formatRiyadhTimeInput(fallbackEnd) : undefined}
              required
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="grid gap-5 border-t border-[var(--border)] pt-7">
        <legend className="text-xl font-extrabold text-[var(--brand-green-deep)]">
          المقاعد والسعر
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="font-bold" htmlFor="event-capacity">السعة</label>
            <input
              id="event-capacity"
              className={inputClassName}
              type="number"
              name="capacity"
              inputMode="numeric"
              min="1"
              max="50"
              step="1"
              defaultValue={event?.capacity}
              aria-describedby={`event-capacity-description${state.error === "capacity" ? " event-capacity-error" : ""}`}
              aria-invalid={state.error === "capacity"}
              required
            />
            <span id="event-capacity-description" className="text-xs muted-copy">من 1 إلى 50 مقعدًا.</span>
            {state.error === "capacity" ? <span id="event-capacity-error" className="text-sm font-bold text-[var(--color-error-text)]">{errorMessages.capacity}</span> : null}
          </div>
          <div className="grid gap-2">
            <label className="font-bold" htmlFor="event-price">السعر بالريال السعودي</label>
            <input
              id="event-price"
              className={inputClassName}
              type="text"
              name="priceSar"
              inputMode="decimal"
              dir="ltr"
              autoComplete="off"
              defaultValue={formatPriceInput(event?.priceHalalas)}
              placeholder="0 للفعالية المجانية"
              aria-describedby={`event-price-description${state.error === "priceHalalas" ? " event-price-error" : ""}`}
              aria-invalid={state.error === "priceHalalas"}
              required
            />
            <span id="event-price-description" className="text-xs muted-copy">اكتب 0 إذا كانت الفعالية مجانية.</span>
            {state.error === "priceHalalas" ? <span id="event-price-error" className="text-sm font-bold text-[var(--color-error-text)]">{errorMessages.priceHalalas}</span> : null}
          </div>
          <div className="grid gap-2">
            <label className="font-bold" htmlFor="event-registration-status">استقبال التسجيلات</label>
            <select
              id="event-registration-status"
              className={inputClassName}
              name="registrationStatus"
              defaultValue={event?.registrationStatus ?? "open"}
              aria-describedby="event-registration-status-description"
            >
              <option value="open">مفتوح</option>
              <option value="closed">مغلق</option>
            </select>
            <span id="event-registration-status-description" className="text-xs muted-copy">
              الامتلاء يُحسب تلقائيًا من الحجوزات النشطة؛ أغلق التسجيل فقط لإيقاف الطلبات الجديدة.
            </span>
            {fieldError("registrationStatus")}
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-2xl bg-[var(--brand-green)] px-6 py-3 font-extrabold text-white transition-[background-color,transform] hover:bg-[#173d21] active:translate-y-px disabled:cursor-wait disabled:opacity-65"
        >
          {pending ? "جارٍ الحفظ…" : submitLabel}
        </button>
        <span className="text-sm muted-copy" aria-live="polite">
          {pending ? "يرجى الانتظار حتى يكتمل الحفظ." : "الحفظ لا ينشر الفعالية تلقائيًا."}
        </span>
      </div>
    </form>
  );
}
