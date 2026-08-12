"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import type { EventAudience, EventAvailability } from "@/lib/domain/types";
import type {
  RegistrationActionError,
  RegistrationActionState,
} from "@/app/(public)/events/[id]/actions";
import { TurnstileField } from "@/features/security/components/TurnstileField";

interface EventRegistrationFormProps {
  action: (
    state: RegistrationActionState,
    formData: FormData,
  ) => Promise<RegistrationActionState>;
  audience: EventAudience;
  availability: EventAvailability;
}

const errorMessages: Record<RegistrationActionError, string> = {
  attendeeName: "أدخل الاسم كاملًا.",
  phone: "أدخل رقم جوال سعودي صحيحًا يبدأ بـ05.",
  email: "تحقق من كتابة البريد الإلكتروني.",
  participantAge: "أدخل عمر المشاركة ضمن الفئة العمرية المحددة.",
  guardianName: "أدخل اسم ولية الأمر كاملًا.",
  guardianConsent: "موافقة ولية الأمر مطلوبة لتسجيل القاصرات.",
  duplicate: "يوجد تسجيل سابق لهذه الفعالية بنفس الجوال أو البريد.",
  unavailable: "التسجيل غير متاح لهذه الفعالية حاليًا.",
  turnstile: "تعذر التحقق الأمني. أكملي التحقق ثم حاولي مرة أخرى.",
  save: "تعذر إكمال التسجيل. حاول مرة أخرى بعد قليل.",
};

const errorField: Partial<Record<RegistrationActionError, string>> = {
  attendeeName: "attendeeName",
  phone: "phone",
  email: "email",
  participantAge: "participantAge",
  guardianName: "guardianName",
  guardianConsent: "guardianConsent",
};

const inputClassName =
  "field-control";

export function EventRegistrationForm({ action, audience, availability }: EventRegistrationFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const minorRegistration = audience !== "adults";

  useEffect(() => {
    if (!state.error) return;
    const name = errorField[state.error];
    if (name) formRef.current?.querySelector<HTMLElement>(`[name="${name}"]`)?.focus();
  }, [state.error]);

  if (state.reference && state.status) {
    const registered = state.status === "registered";
    return (
      <div role="status" className={registered ? "notice-success p-5" : "notice-warning p-5"}>
        <h2 className="text-xl font-extrabold">
          {registered ? "تم تسجيلك في الفعالية" : "تمت إضافتك إلى قائمة الانتظار"}
        </h2>
        <p className="mt-3 text-sm">
          احتفظ بالرقم المرجعي، وستتواصل إدارة النادي عبر WhatsApp عند الحاجة.
        </p>
        <p className="data-value mt-4 break-all border border-current/20 bg-white/70 px-3 py-2 text-sm font-extrabold" dir="ltr">
          {state.reference}
        </p>
        <p className="mt-3 text-xs">لا يتم تحصيل أي مبلغ عبر الموقع؛ الدفع في مقر الفعالية.</p>
        {state.managementPath ? (
          <Link
            className="button-secondary mt-4 bg-white"
            href={state.managementPath}
          >
            إدارة الحجز أو إلغاؤه
          </Link>
        ) : null}
        <p className="mt-3 text-xs">احفظ رابط إدارة الحجز؛ لا يحتوي الرابط على اسم أو رقم جوال.</p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="grid gap-5" noValidate>
      <div>
        <h2 className="text-xl font-extrabold text-[var(--brand-green-deep)]">{availability === "full" ? "قائمة الانتظار" : "التسجيل"}</h2>
        <p className="mt-2 text-sm muted-copy">{availability === "full" ? "اكتملت المقاعد؛ سيُسجل طلبك في قائمة الانتظار." : "التسجيل لشخص واحد ومقعد واحد."}</p>
      </div>

      {state.error && !errorField[state.error] ? (
        <p role="alert" className="notice-error text-sm">
          {errorMessages[state.error]}
        </p>
      ) : null}

      <div className="grid gap-2">
        <label className="font-bold" htmlFor="registration-name">
          {minorRegistration ? "اسم المشاركة كاملًا" : "الاسم كاملًا"}
        </label>
        <input id="registration-name" className={inputClassName} name="attendeeName" autoComplete="name" maxLength={120} aria-describedby={state.error === "attendeeName" ? "registration-name-error" : undefined} aria-invalid={state.error === "attendeeName"} required />
        {state.error === "attendeeName" ? <span id="registration-name-error" className="text-sm text-[var(--color-error-text)]">{errorMessages.attendeeName}</span> : null}
      </div>

      <div className="grid gap-2">
        <label className="font-bold" htmlFor="registration-phone">
          {minorRegistration ? "جوال ولية الأمر" : "رقم الجوال"}
        </label>
        <input id="registration-phone" className={inputClassName} name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="05xxxxxxxx" aria-describedby={`registration-phone-description${state.error === "phone" ? " registration-phone-error" : ""}`} aria-invalid={state.error === "phone"} required />
        <span id="registration-phone-description" className="text-xs muted-copy">سيُستخدم للتواصل عبر WhatsApp بخصوص الحجز والتذكير.</span>
        {state.error === "phone" ? <span id="registration-phone-error" className="text-sm text-[var(--color-error-text)]">{errorMessages.phone}</span> : null}
      </div>

      {minorRegistration ? (
        <>
          <div className="grid gap-2">
            <label className="font-bold" htmlFor="registration-age">عمر المشاركة</label>
            <input
              id="registration-age"
              className={inputClassName}
              name="participantAge"
              type="number"
              inputMode="numeric"
              min={audience === "children" ? 6 : 13}
              max={audience === "children" ? 12 : 17}
              aria-describedby={`registration-age-description${state.error === "participantAge" ? " registration-age-error" : ""}`}
              aria-invalid={state.error === "participantAge"}
              required
            />
            <span id="registration-age-description" className="text-xs muted-copy">
              {audience === "children" ? "الفئة العمرية من 6 إلى 12 سنة." : "الفئة العمرية من 13 إلى 17 سنة."}
            </span>
            {state.error === "participantAge" ? <span id="registration-age-error" className="text-sm text-[var(--color-error-text)]">{errorMessages.participantAge}</span> : null}
          </div>

          <div className="grid gap-2">
            <label className="font-bold" htmlFor="registration-guardian-name">اسم ولية الأمر كاملًا</label>
            <input
              id="registration-guardian-name"
              className={inputClassName}
              name="guardianName"
              autoComplete="name"
              maxLength={120}
              aria-describedby={state.error === "guardianName" ? "registration-guardian-name-error" : undefined}
              aria-invalid={state.error === "guardianName"}
              required
            />
            {state.error === "guardianName" ? <span id="registration-guardian-name-error" className="text-sm text-[var(--color-error-text)]">{errorMessages.guardianName}</span> : null}
          </div>
        </>
      ) : null}

      <div className="grid gap-2">
        <label className="font-bold" htmlFor="registration-email">
          البريد الإلكتروني <span className="text-sm font-normal muted-copy">(اختياري)</span>
        </label>
        <input id="registration-email" className={inputClassName} name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" maxLength={254} aria-describedby={state.error === "email" ? "registration-email-error" : undefined} aria-invalid={state.error === "email"} />
        {state.error === "email" ? <span id="registration-email-error" className="text-sm text-[var(--color-error-text)]">{errorMessages.email}</span> : null}
      </div>

      {minorRegistration ? (
        <label className="flex items-start gap-3 border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm font-bold" htmlFor="guardian-consent">
          <input id="guardian-consent" className="mt-1 size-5 shrink-0" name="guardianConsent" type="checkbox" required />
          <span>أقر بأنني ولية أمر المشاركة أو مخولة منها، وأوافق على تسجيلها والتواصل معي بخصوص الفعالية.</span>
          {state.error === "guardianConsent" ? <span className="text-[var(--color-error-text)]">{errorMessages.guardianConsent}</span> : null}
        </label>
      ) : null}

      <div className="absolute -z-10 size-px overflow-hidden opacity-0" aria-hidden="true">
        <label htmlFor="registration-website">اترك هذا الحقل فارغًا</label>
        <input id="registration-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-xs muted-copy">
        هذه الفعالية مخصصة للنساء. تُستخدم بيانات التواصل لإدارة هذا التسجيل فقط، وتُحذف تلقائيًا بعد 90 يومًا من انتهاء الفعالية.
      </p>

      <TurnstileField />

      <button type="submit" disabled={pending} className="button-primary min-h-12 w-full px-5 py-3">
        {pending ? "جارٍ التسجيل…" : availability === "full" ? "الانضمام إلى قائمة الانتظار" : "تأكيد التسجيل"}
      </button>
    </form>
  );
}
