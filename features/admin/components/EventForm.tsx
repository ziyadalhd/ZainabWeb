"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Event } from "@/lib/domain/types";
import { EventDateTimePicker } from "@/features/admin/components/EventDateTimePicker";
import { formatRiyadhDateInput, formatRiyadhTimeInput } from "@/lib/format/date";
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
  kind: "اختر مسارًا صحيحًا للفعالية.",
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
  kind: "event-kind",
  eventTypeLabel: "eventTypeLabel",
  startsAt: "startDate",
  endsAt: "endDate",
  capacity: "capacity",
  priceHalalas: "priceSar",
};

const inputClassName =
  "field-control";

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
      className="form-surface mt-8 grid max-w-5xl gap-9 p-5 sm:p-8"
      noValidate
    >
      {state.error === "save" || state.error === "registrationStatus" ? (
        <p
          role="alert"
          className="notice-error"
        >
          {errorMessages[state.error]}
        </p>
      ) : null}

      <fieldset className="grid gap-5">
        <legend className="mb-2 border-r-4 border-[var(--brand-olive)] pr-3 text-xl font-black text-[var(--brand-forest)]">
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
          <label className="grid gap-2 font-bold" htmlFor="event-kind">
            مسار الفعالية
            <select
              id="event-kind"
              className={inputClassName}
              name="kind"
              defaultValue={event?.kind ?? "club_event"}
            >
              <option value="club_event">فعالية النادي</option>
              <option value="bayn_trip">رحلة بَيْن</option>
            </select>
            <span className="text-xs font-normal muted-copy">رحلة بَيْن تظهر أيضًا في صفحة رحلات بَيْن وتستخدم التسجيل نفسه.</span>
            {fieldError("kind")}
          </label>
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

      <fieldset className="grid gap-5 border-t border-[var(--color-border)] pt-7">
        <legend className="mb-2 border-r-4 border-[var(--brand-olive)] pr-3 text-xl font-black text-[var(--brand-forest)]">
          الموعد بتوقيت السعودية
        </legend>
        <div className="grid gap-5 lg:grid-cols-2">
          <EventDateTimePicker
            id="event-start"
            label="بداية الفعالية"
            dateName="startDate"
            timeName="startTime"
            defaultDate={event ? formatRiyadhDateInput(event.startsAt) : undefined}
            defaultTime={event ? formatRiyadhTimeInput(event.startsAt) : undefined}
            error={state.error === "startsAt" ? errorMessages.startsAt : undefined}
            onValueChange={() => setDirty(true)}
          />
          <EventDateTimePicker
            id="event-end"
            label="نهاية الفعالية"
            dateName="endDate"
            timeName="endTime"
            defaultDate={fallbackEnd ? formatRiyadhDateInput(fallbackEnd) : event ? formatRiyadhDateInput(event.startsAt) : undefined}
            defaultTime={fallbackEnd ? formatRiyadhTimeInput(fallbackEnd) : undefined}
            error={state.error === "endsAt" ? errorMessages.endsAt : undefined}
            onValueChange={() => setDirty(true)}
          />
        </div>
      </fieldset>

      <fieldset className="grid gap-5 border-t border-[var(--color-border)] pt-7">
        <legend className="mb-2 border-r-4 border-[var(--brand-olive)] pr-3 text-xl font-black text-[var(--brand-forest)]">
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
              placeholder="مثال: 0 للفعالية المجانية…"
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

      <div className="flex flex-col items-stretch gap-3 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="button-primary min-h-12 px-6 py-3"
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
