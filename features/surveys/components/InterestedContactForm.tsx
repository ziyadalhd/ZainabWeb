"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { submitInterestedContactAction, type InterestedContactActionError } from "@/app/(public)/surveys/interested-contact/actions";

const errorMessages: Record<InterestedContactActionError, string> = {
  contactName: "اكتبي الاسم من حرفين إلى ١٢٠ حرفًا.",
  phone: "اكتبي رقم جوال سعودي صحيحًا.",
  email: "اكتبي بريدًا إلكترونيًا صحيحًا.",
  consent: "يلزم تحديد موافقتك لتسجيل اهتمامك بالفعاليات القادمة.",
  invalid: "تحققي من البيانات ثم حاولي مرة أخرى.",
  save: "تعذر الحفظ الآن. حاولي مرة أخرى بعد قليل.",
};

const errorField: Partial<Record<InterestedContactActionError, string>> = {
  contactName: "contactName",
  phone: "phone",
  email: "email",
  consent: "upcomingEventsConsent",
};

export function InterestedContactForm() {
  const [state, formAction, pending] = useActionState(submitInterestedContactAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const field = state.error ? errorField[state.error] : undefined;
    if (field) formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  }, [state.error]);

  if (state.saved) {
    return (
      <div role="status" className="rounded-[var(--radius-surface)] border border-[var(--brand-olive)] bg-[var(--color-success-bg)] p-6 sm:p-8">
        <h2 className="text-2xl font-black text-[var(--brand-forest)]">سجّلنا اهتمامكِ</h2>
        <p className="mt-3 leading-7">يمكنكِ إلغاء الاشتراك من الرابط أدناه.</p>
        {state.unsubscribePath ? (
          <Link href={state.unsubscribePath} className="mt-5 inline-flex min-h-11 items-center font-bold underline underline-offset-4">
            إلغاء الاشتراك
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="form-surface grid gap-6 p-5 sm:p-8" noValidate>
      <div className="border-b border-[var(--color-border)] pb-5">
        <h2 className="text-xl font-black text-[var(--brand-forest)]">بياناتكِ</h2>
        <p className="mt-1 text-sm muted-copy">الحقول كلها مطلوبة لتسجيل الاهتمام.</p>
      </div>
      {state.error && !errorField[state.error] ? (
        <p role="alert" className="notice-error text-sm">
          {errorMessages[state.error]}
        </p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="contact-name" className="font-bold text-[var(--brand-forest)]">
            الاسم
          </label>
          <input
            id="contact-name"
            name="contactName"
            required
            maxLength={120}
            autoComplete="name"
            className="field-control"
            placeholder="اسمكِ الكريم"
            aria-invalid={state.error === "contactName"}
            aria-describedby={state.error === "contactName" ? "contact-name-error" : undefined}
          />
          {state.error === "contactName" ? (
            <span id="contact-name-error" role="alert" className="text-sm text-[var(--color-error-text)]">
              {errorMessages.contactName}
            </span>
          ) : null}
        </div>
        <div className="grid gap-2">
          <label htmlFor="contact-phone" className="font-bold text-[var(--brand-forest)]">
            رقم الجوال السعودي
          </label>
          <input
            id="contact-phone"
            name="phone"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="05xxxxxxxx"
            dir="ltr"
            className="field-control text-right"
            aria-invalid={state.error === "phone"}
            aria-describedby={state.error === "phone" ? "contact-phone-error" : undefined}
          />
          {state.error === "phone" ? (
            <span id="contact-phone-error" role="alert" className="text-sm text-[var(--color-error-text)]">
              {errorMessages.phone}
            </span>
          ) : null}
        </div>
      </div>
      <div className="grid gap-2">
        <label htmlFor="contact-email" className="font-bold text-[var(--brand-forest)]">
          البريد الإلكتروني
        </label>
        <input
          id="contact-email"
          name="email"
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          dir="ltr"
          className="field-control text-right"
          placeholder="name@example.com"
          maxLength={254}
          aria-invalid={state.error === "email"}
          aria-describedby={state.error === "email" ? "contact-email-error" : undefined}
        />
        {state.error === "email" ? (
          <span id="contact-email-error" role="alert" className="text-sm text-[var(--color-error-text)]">
            {errorMessages.email}
          </span>
        ) : null}
      </div>
      <div className="border-t border-[var(--color-border)] pt-5">
        <label className="flex min-h-12 items-start gap-3 rounded-[var(--radius-control)] bg-[var(--color-surface-muted)] p-4 text-sm leading-7">
          <input
            name="upcomingEventsConsent"
            type="checkbox"
            required
            className="mt-1 size-5 shrink-0 accent-[var(--brand-forest)]"
            aria-invalid={state.error === "consent"}
            aria-describedby={state.error === "consent" ? "contact-consent-error" : undefined}
          />
          <span>أوافق على أن يستخدم النادي بريدي الإلكتروني لإرسال معلومات الفعاليات القادمة، ويمكنني إلغاء الاشتراك لاحقًا.</span>
        </label>
        {state.error === "consent" ? (
          <span id="contact-consent-error" role="alert" className="mt-2 block text-sm text-[var(--color-error-text)]">
            {errorMessages.consent}
          </span>
        ) : null}
      </div>
      <button type="submit" disabled={pending} className="button-primary min-h-12 w-full px-6 py-3 sm:w-fit">
        {pending ? "جارٍ الحفظ…" : "سجّلي اهتمامكِ"}
      </button>
    </form>
  );
}
