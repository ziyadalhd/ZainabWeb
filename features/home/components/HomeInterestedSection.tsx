"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  submitInterestedContactAction,
  type InterestedContactActionError,
} from "@/app/(public)/surveys/interested-contact/actions";

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

export function HomeInterestedSection() {
  const [state, formAction, pending] = useActionState(submitInterestedContactAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const field = state.error ? errorField[state.error] : undefined;
    if (field) formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  }, [state.error]);

  return (
    <section id="interest" className="border-t border-[var(--color-border)] bg-[var(--brand-cream)]/50">
      <div className="page-shell section-space">
        <div className="mx-auto grid max-w-5xl gap-7 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_18px_45px_rgb(40_75_47_/_0.08)] sm:p-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(22rem,1fr)] lg:gap-12 lg:p-10">
          <div className="self-center">
            <p className="eyebrow">خليكِ قريبة</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[var(--brand-forest)] sm:text-4xl">نبقيكِ على اطلاع</h2>
            <p className="mt-4 max-w-md text-base leading-8 text-[var(--brand-forest)]/80">سجّلي اهتمامكِ لتصلكِ معلومات الفعاليات والأنشطة القادمة من نادي بَيْن الثقافي.</p>
            <p className="mt-5 border-s-4 border-[var(--brand-amber)] ps-4 text-sm leading-7 muted-copy">يُستخدم بريدكِ لإرسال أخبار الفعاليات فقط، ويمكنكِ إلغاء الاشتراك متى شئتِ.</p>
          </div>

          <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/55 p-4 sm:p-6">
            {state.saved ? (
              <div role="status" className="notice-success">
                <h3 className="text-lg font-black">تم تسجيل اهتمامكِ</h3>
                <p className="mt-2 text-sm leading-7">سنشارككِ أخبار الفعاليات القادمة عبر البريد الإلكتروني.</p>
                {state.unsubscribePath ? <Link href={state.unsubscribePath} className="mt-4 inline-block text-sm font-bold underline underline-offset-4">إلغاء الاشتراك</Link> : null}
              </div>
            ) : (
              <form ref={formRef} action={formAction} className="grid gap-4" noValidate>
                {state.error && !errorField[state.error] ? <p role="alert" className="notice-error text-sm">{errorMessages[state.error]}</p> : null}
                <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="home-contact-name" className="font-bold text-[var(--brand-green-deep)]">
                    الاسم
                  </label>
                  <input
                    id="home-contact-name"
                    name="contactName"
                    required
                    maxLength={120}
                    autoComplete="name"
                    className="field-control"
                    placeholder="اسمكِ الكريم"
                    aria-invalid={state.error === "contactName"}
                  />
                  {state.error === "contactName" ? <span className="text-sm text-[var(--color-error-text)]">{errorMessages.contactName}</span> : null}
                </div>
                <div className="grid gap-2">
                  <label htmlFor="home-contact-phone" className="font-bold text-[var(--brand-green-deep)]">
                    رقم الجوال السعودي
                  </label>
                  <input
                    id="home-contact-phone"
                    name="phone"
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                    className="field-control text-right"
                    aria-invalid={state.error === "phone"}
                  />
                  {state.error === "phone" ? <span className="text-sm text-[var(--color-error-text)]">{errorMessages.phone}</span> : null}
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="home-contact-email" className="font-bold text-[var(--brand-green-deep)]">
                  البريد الإلكتروني
                </label>
                <input
                  id="home-contact-email"
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
                />
                {state.error === "email" ? <span className="text-sm text-[var(--color-error-text)]">{errorMessages.email}</span> : null}
              </div>

              <label className="flex items-start gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white/65 p-3 text-xs leading-6 sm:text-sm">
                <input
                  name="upcomingEventsConsent"
                  type="checkbox"
                  required
                  className="mt-1 size-5 accent-[var(--brand-green)]"
                  aria-invalid={state.error === "consent"}
                />
                <span>
                  أوافق على أن يستخدم النادي بريدي الإلكتروني لإرسال معلومات الفعاليات القادمة، ويمكنني إلغاء الاشتراك لاحقًا.
                </span>
              </label>
              {state.error === "consent" ? <span className="text-sm text-[var(--color-error-text)]">{errorMessages.consent}</span> : null}

              <button type="submit" disabled={pending} className="button-primary min-h-12 w-full px-5 py-3 sm:w-fit">
                {pending ? "جارٍ الحفظ…" : "سجّلي اهتمامكِ"}
              </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
