"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Event, EventAudience } from "@/lib/domain/types";
import { useToast } from "@/components/ui/ToastProvider";
import { EventPosterField } from "@/features/admin/components/EventPosterField";
import { EventCardView } from "@/features/events/components/EventCardView";
import { eventAudienceLabels } from "@/features/events/event-presentation";
import { isEventAudience, parsePriceSarToHalalas, riyadhDateAndTimeToIso } from "@/lib/domain/event-input";
import { EventSchedulePicker } from "@/features/scheduling/components/EventSchedulePicker";
import { formatRiyadhDateInput, formatRiyadhTimeInput } from "@/lib/format/date";
import type { EventFormActionError, EventFormActionState } from "@/app/(dashboard)/admin/(protected)/events/actions";

interface EventFormProps {
  action: (state: EventFormActionState, formData: FormData) => Promise<EventFormActionState>;
  event?: Event;
  submitLabel: string;
  onSaved?: () => void;
}

const errorMessages: Record<EventFormActionError, string> = {
  title: "أدخل عنوانًا للفعالية.",
  audience: "اختر فئة صحيحة.",
  kind: "اختر مسارًا صحيحًا للفعالية.",
  eventTypeLabel: "أدخل نوع الفعالية.",
  startsAt: "أدخل تاريخ البداية ووقتها بتوقيت السعودية.",
  endsAt: "يجب أن تكون نهاية الفعالية بعد بدايتها.",
  capacity: "أدخل سعة صحيحة من ١ إلى ٥٠ مقعدًا.",
  priceHalalas: "أدخل سعرًا صحيحًا بالريال، أو ٠ للفعالية المجانية.",
  registrationStatus: "تعذر تحديد حالة التسجيل.",
  save: "تعذر حفظ الفعالية. لم تُفقد البيانات؛ حاول مرة أخرى.",
};

const fieldForError: Partial<Record<EventFormActionError, string>> = {
  title: "event-title",
  audience: "event-audience",
  kind: "event-kind",
  eventTypeLabel: "event-type",
  startsAt: "event-start-date",
  endsAt: "event-start-date",
  capacity: "event-capacity",
  priceHalalas: "event-price",
};

interface FormSection {
  id: string;
  label: string;
  fields: readonly EventFormActionError[];
}

const sections: readonly FormSection[] = [
  { id: "basics", label: "الأساسيات", fields: ["title", "audience", "kind", "eventTypeLabel"] },
  { id: "schedule", label: "الموعد", fields: ["startsAt", "endsAt"] },
  { id: "capacity", label: "المقاعد والفئة", fields: ["capacity", "registrationStatus"] },
  { id: "pricing", label: "السعر والنشر", fields: ["priceHalalas", "save"] },
];

const inputClassName = "field-control";

function formatPriceInput(priceHalalas: number | null | undefined): string {
  if (priceHalalas === null || priceHalalas === undefined) return "";
  const whole = Math.floor(priceHalalas / 100);
  const fraction = priceHalalas % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, "0")}`;
}

interface PreviewSnapshot {
  title: string;
  audience: EventAudience;
  eventTypeLabel: string;
  startsAt: Date | null;
  endsAt: Date | null;
  capacity: number | null;
  priceHalalas: number | null;
}

function readPreviewSnapshot(form: HTMLFormElement | null, fallback: PreviewSnapshot): PreviewSnapshot {
  if (!form) return fallback;
  const formData = new FormData(form);
  const audienceRaw = String(formData.get("audience") ?? "");
  const startsAtIso = riyadhDateAndTimeToIso(String(formData.get("startDate") ?? ""), String(formData.get("startTime") ?? ""));
  const endsAtIso = riyadhDateAndTimeToIso(String(formData.get("endDate") ?? ""), String(formData.get("endTime") ?? ""));
  const capacity = Number(String(formData.get("capacity") ?? ""));

  return {
    title: String(formData.get("title") ?? "").trim(),
    audience: isEventAudience(audienceRaw) ? audienceRaw : fallback.audience,
    eventTypeLabel: String(formData.get("eventTypeLabel") ?? "").trim(),
    startsAt: startsAtIso ? new Date(startsAtIso) : null,
    endsAt: endsAtIso ? new Date(endsAtIso) : null,
    capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : null,
    priceHalalas: parsePriceSarToHalalas(String(formData.get("priceSar") ?? "")),
  };
}

export function EventForm({ action, event, submitLabel, onSaved }: EventFormProps) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const [dirty, setDirty] = useState(false);
  // Held only to feed the live card preview; EventPosterField owns the object URL's lifetime.
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { pushToast } = useToast();
  const [handledState, setHandledState] = useState(state);

  const initialPreview: PreviewSnapshot = {
    title: event?.title ?? "",
    audience: event?.audience ?? "adults",
    eventTypeLabel: event?.eventTypeLabel ?? "",
    startsAt: event ? new Date(event.startsAt) : null,
    endsAt: event?.endsAt ? new Date(event.endsAt) : null,
    capacity: event?.capacity ?? null,
    priceHalalas: event?.priceHalalas ?? null,
  };
  const [preview, setPreview] = useState<PreviewSnapshot>(initialPreview);
  const refreshPreview = () => setPreview(readPreviewSnapshot(formRef.current, initialPreview));

  if (state !== handledState) {
    setHandledState(state);
    if (state.status === "success" && event) setDirty(false);
  }

  useEffect(() => {
    if (state.status !== "success") return;
    if (event) {
      pushToast("تم حفظ تعديلات الفعالية.", "success");
      onSaved?.();
    } else if (state.eventId) {
      router.push(`/admin/events?event=${state.eventId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire only when the action result changes
  }, [state]);

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeUnload = (browserEvent: BeforeUnloadEvent) => {
      browserEvent.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!state.errors || state.errors.length === 0) return;
    summaryRef.current?.focus();
  }, [state.errors]);

  const errors = state.errors ?? [];
  const hasError = (field: EventFormActionError) => errors.includes(field);
  const fieldError = (field: EventFormActionError) =>
    hasError(field) ? <span className="text-sm font-bold text-[var(--color-error-text)]">{errorMessages[field]}</span> : null;

  const readyToPublish = event ? event.endsAt !== null && event.priceHalalas !== null : true;
  const minStartDate = event ? undefined : formatRiyadhDateInput(new Date());

  return (
    <div className="mt-8 grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <form
        ref={formRef}
        action={formAction}
        onChange={() => {
          setDirty(true);
          refreshPreview();
        }}
        className="form-surface grid gap-9 p-5 sm:p-8"
        noValidate
      >
        {errors.length > 0 ? (
          <div ref={summaryRef} tabIndex={-1} role="alert" className="notice-error grid gap-2 outline-none">
            <p className="font-bold">{errors.length === 1 ? "يوجد خطأ واحد يمنع الحفظ:" : `يوجد ${errors.length} أخطاء تمنع الحفظ:`}</p>
            <ul className="grid gap-1 pr-5 text-sm">
              {errors.map((code) => {
                const fieldId = fieldForError[code];
                return (
                  <li key={code}>
                    {fieldId ? (
                      <a href={`#${fieldId}`} className="underline decoration-2 underline-offset-4">
                        {errorMessages[code]}
                      </a>
                    ) : (
                      errorMessages[code]
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <nav aria-label="أقسام النموذج" className="event-panel__section-nav">
          {sections.map((section) => {
            const sectionHasError = section.fields.some(hasError);
            return (
              <a key={section.id} href={`#form-section-${section.id}`} className={sectionHasError ? "text-[var(--color-error-text)]" : undefined}>
                {section.label}
                {sectionHasError ? " •" : null}
              </a>
            );
          })}
        </nav>

        <fieldset id="form-section-basics" className="grid gap-5 scroll-mt-24">
          <legend className="mb-2 border-r-4 border-[var(--brand-olive)] pr-3 text-xl font-bold text-[var(--brand-forest)]">المعلومات الأساسية</legend>
          <label className="grid gap-2 font-medium" htmlFor="event-title">
            عنوان الفعالية
            <input id="event-title" className={inputClassName} name="title" defaultValue={event?.title} autoComplete="off" maxLength={140} required />
            {fieldError("title")}
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 font-medium" htmlFor="event-kind">
              مسار الفعالية
              <select id="event-kind" className={inputClassName} name="kind" defaultValue={event?.kind ?? "club_event"}>
                <option value="club_event">فعالية النادي</option>
                <option value="bayn_trip">رحلة بَيْن</option>
              </select>
              <span className="text-xs font-normal muted-copy">رحلة بَيْن تظهر أيضًا في صفحة رحلات بَيْن وتستخدم التسجيل نفسه.</span>
              {fieldError("kind")}
            </label>
            <label className="grid gap-2 font-medium" htmlFor="event-audience">
              الفئة
              <select id="event-audience" className={inputClassName} name="audience" defaultValue={event?.audience ?? "adults"}>
                {Object.entries(eventAudienceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {fieldError("audience")}
            </label>
            <label className="grid gap-2 font-medium" htmlFor="event-type">
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

        <fieldset id="form-section-schedule" className="grid gap-5 scroll-mt-24 border-t border-[var(--color-border)] pt-7">
          <legend className="mb-2 border-r-4 border-[var(--brand-olive)] pr-3 text-xl font-bold text-[var(--brand-forest)]">الموعد والمكان</legend>
          <EventSchedulePicker
            defaultStartDate={event ? formatRiyadhDateInput(event.startsAt) : undefined}
            defaultStartTime={event ? formatRiyadhTimeInput(event.startsAt) : undefined}
            defaultEndDate={event?.endsAt ? formatRiyadhDateInput(event.endsAt) : undefined}
            defaultEndTime={event?.endsAt ? formatRiyadhTimeInput(event.endsAt) : undefined}
            startError={hasError("startsAt") ? errorMessages.startsAt : undefined}
            endError={hasError("endsAt") ? errorMessages.endsAt : undefined}
            minStartDate={minStartDate}
            onValueChange={() => {
              setDirty(true);
              refreshPreview();
            }}
          />
        </fieldset>

        <fieldset id="form-section-capacity" className="grid gap-5 scroll-mt-24 border-t border-[var(--color-border)] pt-7">
          <legend className="mb-2 border-r-4 border-[var(--brand-olive)] pr-3 text-xl font-bold text-[var(--brand-forest)]">المقاعد والفئة</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="font-medium" htmlFor="event-capacity">
                السعة
              </label>
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
                aria-describedby={`event-capacity-description${hasError("capacity") ? " event-capacity-error" : ""}`}
                aria-invalid={hasError("capacity")}
                required
              />
              <span id="event-capacity-description" className="text-xs muted-copy">
                من ١ إلى ٥٠ مقعدًا.
              </span>
              {hasError("capacity") ? (
                <span id="event-capacity-error" className="text-sm font-bold text-[var(--color-error-text)]">
                  {errorMessages.capacity}
                </span>
              ) : null}
            </div>
            <div className="grid gap-2">
              <label className="font-medium" htmlFor="event-registration-status">
                استقبال التسجيلات
              </label>
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

        <fieldset id="form-section-pricing" className="grid gap-5 scroll-mt-24 border-t border-[var(--color-border)] pt-7">
          <legend className="mb-2 border-r-4 border-[var(--brand-olive)] pr-3 text-xl font-bold text-[var(--brand-forest)]">السعر والنشر</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="font-medium" htmlFor="event-price">
                السعر بالريال السعودي
              </label>
              <input
                id="event-price"
                className={inputClassName}
                type="text"
                name="priceSar"
                inputMode="decimal"
                dir="ltr"
                autoComplete="off"
                defaultValue={formatPriceInput(event?.priceHalalas)}
                placeholder="مثال: ٠ للفعالية المجانية…"
                aria-describedby={`event-price-description${hasError("priceHalalas") ? " event-price-error" : ""}`}
                aria-invalid={hasError("priceHalalas")}
                required
              />
              <span id="event-price-description" className="text-xs muted-copy">
                اكتب ٠ إذا كانت الفعالية مجانية.
              </span>
              {hasError("priceHalalas") ? (
                <span id="event-price-error" className="text-sm font-bold text-[var(--color-error-text)]">
                  {errorMessages.priceHalalas}
                </span>
              ) : null}
            </div>
          </div>

          {event ? (
            <div className="card-surface grid gap-2 p-4">
              <p className="text-sm font-bold text-[var(--brand-forest)]">{readyToPublish ? "الفعالية جاهزة للنشر." : "لا يمكن نشر الفعالية بعد:"}</p>
              {!readyToPublish ? (
                <ul className="grid gap-1 pr-5 text-sm muted-copy">
                  {event.endsAt === null ? <li>أضيفي وقت نهاية الفعالية.</li> : null}
                  {event.priceHalalas === null ? <li>أضيفي سعر الفعالية (أو ٠ إن كانت مجانية).</li> : null}
                </ul>
              ) : null}
            </div>
          ) : null}

          <EventPosterField
            inputId="event-poster"
            label={event?.posterUrl ? "استبدال البوستر" : "إضافة بوستر"}
            currentPosterUrl={event?.posterUrl ?? null}
            previewAlt={event?.title ? `بوستر فعالية ${event.title}` : "معاينة بوستر الفعالية"}
            onPreviewChange={setLocalPreviewUrl}
            onPicked={() => setDirty(true)}
          />
        </fieldset>

        <div className="flex flex-col items-stretch gap-3 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:items-center">
          <button type="submit" disabled={pending} className="button-primary min-h-12 px-6 py-3">
            {pending ? "جارٍ الحفظ…" : submitLabel}
          </button>
          <span className="text-sm muted-copy" aria-live="polite">
            {pending ? "يرجى الانتظار حتى يكتمل الحفظ." : "الحفظ لا ينشر الفعالية تلقائيًا."}
          </span>
        </div>
      </form>

      <aside className="lg:sticky lg:top-24">
        <p className="eyebrow">معاينة بطاقة الفعالية</p>
        <p className="mt-2 mb-4 text-sm leading-6 muted-copy">هذا ما ستراه الزائرة في صفحة الفعاليات.</p>
        <EventCardView
          title={preview.title}
          audienceLabel={eventAudienceLabels[preview.audience]}
          eventTypeLabel={preview.eventTypeLabel}
          startsAt={preview.startsAt}
          endsAt={preview.endsAt}
          capacity={preview.capacity}
          priceHalalas={preview.priceHalalas}
          posterUrl={localPreviewUrl ?? event?.posterUrl ?? null}
          statusLabel="التسجيل متاح"
          actionLabel="احجزي مكانك"
          compact
        />
      </aside>
    </div>
  );
}
