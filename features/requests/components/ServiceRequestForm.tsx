"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import type { ServiceRequestActionState } from "@/app/(public)/requests/actions";
import type { ServiceRequestKind } from "@/lib/domain/types";
import { TurnstileField } from "@/features/security/components/TurnstileField";
import { RequestSchedulePicker } from "@/features/scheduling/components/RequestSchedulePicker";

interface ServiceRequestFormProps {
  kind: ServiceRequestKind;
  action: (state: ServiceRequestActionState, formData: FormData) => Promise<ServiceRequestActionState>;
}

const inputClassName = "field-control";

const errorMessages: Record<string, string> = {
  requesterName: "أدخلي الاسم كاملًا.",
  phone: "أدخلي رقم جوال سعودي صحيحًا يبدأ بـ05.",
  email: "تحققي من البريد الإلكتروني.",
  useOrOccasionType: "أدخلي نوع الاستخدام أو المناسبة.",
  requestedDate: "اختاري التاريخ المطلوب.",
  requestedTime: "تحققي من وقت البداية والنهاية.",
  attendeeCount: "أدخلي عدد الحاضرات المتوقع.",
  workshopTitle: "أدخلي عنوان الورشة.",
  workshopDescription: "أدخلي وصفًا للورشة.",
  workshopTargetAudience: "حددي الفئة المستهدفة.",
  workshopDuration: "أدخلي مدة الورشة.",
  workshopExpectedAttendance: "أدخلي العدد المتوقع.",
  workshopRequirements: "أدخلي متطلبات الورشة.",
  workshopPortfolioUrl: "تحققي من رابط الخبرة أو الملف.",
  notes: "الملاحظات أطول من الحد المسموح.",
  invalid: "تعذر التحقق من الطلب. أعيدي المحاولة.",
  turnstile: "ما قدرنا نكمل التحقق. جرّبي مرة ثانية",
  save: "تعذر إرسال الطلب الآن. حاولي مرة أخرى بعد قليل.",
};

function Field({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="grid gap-2">{children}</div>;
}

export function ServiceRequestForm({ kind, action }: ServiceRequestFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const workshop = kind === "workshop_application";
  const label = kind === "space_booking" ? "إرسال طلب حجز المساحة" : kind === "celebration_booking" ? "إرسال طلب إقامة الحفل" : "إرسال طلب الورشة";

  if (state.reference && state.managementPath) {
    return (
      <div role="status" className="notice-success p-5">
        <h2 className="text-xl font-extrabold">تم استلام طلبك</h2>
        <p className="mt-3 text-sm">هذا الطلب لا يمثل حجزًا مؤكدًا. ستراجعه إدارة النادي ثم تتواصل معك.</p>
        <p className="data-value mt-4 break-all border border-current/20 bg-white/75 px-3 py-2 text-sm font-extrabold" dir="ltr">{state.reference}</p>
        <Link className="button-secondary mt-4 bg-white" href={state.managementPath}>
          عرض الطلب أو إلغاؤه
        </Link>
        <p className="mt-3 text-xs">احتفظي بالرابط إذا حبيتي ترجعين لطلبك أو تلغينه لاحقًا.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="request-form" noValidate>
      {state.error ? <p role="alert" className="notice-error text-sm">{errorMessages[state.error] ?? errorMessages.save}</p> : null}

      <fieldset className="request-group">
        <legend className="request-group__title">بيانات التواصل</legend>
        <div className="grid gap-5 pt-2">
          <Field>
            <label className="font-bold" htmlFor="requester-name">الاسم كاملًا</label>
            <input id="requester-name" className={inputClassName} name="requesterName" autoComplete="name" maxLength={120} required />
          </Field>
          <Field>
            <label className="font-bold" htmlFor="request-phone">رقم الجوال</label>
            <input id="request-phone" className={inputClassName} name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="05xxxxxxxx" required />
            <span className="text-xs muted-copy">سيُستخدم للتواصل بشأن هذا الطلب فقط.</span>
          </Field>
          <Field>
            <label className="font-bold" htmlFor="request-email">البريد الإلكتروني <span className="text-sm font-normal muted-copy">(اختياري)</span></label>
            <input id="request-email" className={inputClassName} name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" maxLength={254} />
          </Field>
        </div>
      </fieldset>

      {workshop ? (
        <fieldset className="request-group">
          <legend className="request-group__title">تفاصيل الورشة</legend>
          <div className="grid gap-5 pt-2">
            <Field><label className="font-bold" htmlFor="workshop-title">عنوان الورشة</label><input id="workshop-title" className={inputClassName} name="workshopTitle" maxLength={200} required /></Field>
            <Field><label className="font-bold" htmlFor="workshop-description">وصف الورشة</label><textarea id="workshop-description" className={inputClassName} name="workshopDescription" rows={5} maxLength={4000} required /></Field>
            <Field><label className="font-bold" htmlFor="workshop-audience">الفئة المستهدفة</label><input id="workshop-audience" className={inputClassName} name="workshopTargetAudience" maxLength={200} required /></Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field><label className="font-bold" htmlFor="workshop-duration">مدة الورشة</label><input id="workshop-duration" className={inputClassName} name="workshopDuration" maxLength={160} required /></Field>
              <Field><label className="font-bold" htmlFor="workshop-attendance">عدد الحاضرات المتوقع</label><input id="workshop-attendance" className={inputClassName} name="workshopExpectedAttendance" type="number" min="1" inputMode="numeric" required /></Field>
            </div>
            <Field><label className="font-bold" htmlFor="workshop-requirements">متطلبات الورشة</label><textarea id="workshop-requirements" className={inputClassName} name="workshopRequirements" rows={4} maxLength={2000} required /></Field>
            <Field><label className="font-bold" htmlFor="workshop-portfolio">رابط الخبرة أو الملف <span className="text-sm font-normal muted-copy">(اختياري)</span></label><input id="workshop-portfolio" className={inputClassName} name="workshopPortfolioUrl" type="url" inputMode="url" dir="ltr" /></Field>
          </div>
        </fieldset>
      ) : (
        <fieldset className="request-group">
          <legend className="request-group__title">تفاصيل الطلب</legend>
          <div className="grid gap-5 pt-2">
            <Field><label className="font-bold" htmlFor="request-use">نوع الاستخدام أو المناسبة</label><input id="request-use" className={inputClassName} name="useOrOccasionType" maxLength={160} required /></Field>
            <RequestSchedulePicker />
            <Field><label className="font-bold" htmlFor="request-attendance">عدد الحاضرات المتوقع</label><input id="request-attendance" className={inputClassName} name="attendeeCount" type="number" min="1" inputMode="numeric" required /></Field>
          </div>
        </fieldset>
      )}

      <fieldset className="request-group">
        <legend className="request-group__title">معلومات إضافية</legend>
        <div className="pt-2">
          <Field>
            <label className="font-bold" htmlFor="request-notes">ملاحظات <span className="text-sm font-normal muted-copy">(اختياري)</span></label>
            <textarea id="request-notes" className={inputClassName} name="notes" rows={4} maxLength={4000} />
          </Field>
        </div>
      </fieldset>
      <div className="request-form__footer">
        <p className="text-xs muted-copy">هذا طلب مراجعة وليس حجزًا فوريًا. تُحذف بيانات الطلب تلقائيًا بعد 90 يومًا من إغلاقه.</p>
        <TurnstileField />
        <button type="submit" disabled={pending} className="button-primary min-h-12 px-5 py-3">{pending ? "جارٍ الإرسال…" : label}</button>
      </div>
    </form>
  );
}
