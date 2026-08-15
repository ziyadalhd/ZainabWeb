"use client";

import { useActionState } from "react";
import type { SubmitEventFeedbackActionState } from "@/app/(public)/surveys/event-feedback/[token]/actions";
import { TurnstileField } from "@/features/security/components/TurnstileField";

const ratings = [5, 4, 3, 2, 1] as const;

const errors: Record<NonNullable<SubmitEventFeedbackActionState["error"]>, string> = {
  hospitalityRating: "اختاري تقييم الضيافة من ١ إلى ٥.",
  materialRating: "اختاري تقييم المادة من ١ إلى ٥.",
  identityVisible: "حددي ما إذا كنتِ ترغبين بإظهار اسمك للمسؤولة.",
  suggestions: "المقترحات طويلة جدًا؛ الحد الأقصى ٤٠٠٠ حرف.",
  turnstile: "تعذر التحقق الأمني. أكملي التحقق ثم حاولي مرة أخرى.",
  save: "تعذر حفظ التقييم. ربما استُخدم الرابط أو انتهت صلاحيته؛ اطلبي رابطًا جديدًا من النادي.",
};

function RatingField({ name, legend, error }: { name: string; legend: string; error?: string }) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="font-extrabold text-[var(--brand-green-deep)]">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-3" dir="ltr">
        {ratings.map((rating) => (
          <label key={rating} className="flex size-12 cursor-pointer items-center justify-center rounded-sm border border-[var(--color-border)] bg-white font-bold has-checked:border-[var(--brand-forest)] has-checked:bg-[var(--brand-forest)] has-checked:text-[var(--color-on-primary)]">
            <input type="radio" name={name} value={rating} className="sr-only" required />
            {rating}
          </label>
        ))}
      </div>
      {error ? <p id={`${name}-error`} role="alert" className="mt-3 text-sm font-bold text-[var(--color-error-text)]">{error}</p> : null}
    </fieldset>
  );
}

export function EventFeedbackForm({
  action,
}: {
  action: (state: SubmitEventFeedbackActionState, formData: FormData) => Promise<SubmitEventFeedbackActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="form-surface mt-10 grid gap-8 p-5 sm:p-8" noValidate>
      <RatingField name="hospitalityRating" legend="تقييم الضيافة" error={state.error === "hospitalityRating" ? errors.hospitalityRating : undefined} />
      <RatingField name="materialRating" legend="تقييم المادة" error={state.error === "materialRating" ? errors.materialRating : undefined} />
      <label className="grid gap-3 font-extrabold text-[var(--brand-green-deep)]">
        المقترحات
        <textarea name="suggestions" rows={5} maxLength={4000} className="field-control resize-y bg-white font-normal" />
      </label>
      {state.error === "suggestions" ? <p role="alert" className="font-bold text-[var(--color-error-text)]">{errors.suggestions}</p> : null}
      <fieldset>
        <legend className="font-extrabold text-[var(--brand-green-deep)]">إظهار الاسم للمسؤولة</legend>
        <p className="mt-2 text-sm muted-copy">يمكنكِ إرسال التقييم باسمك أو دون إظهار هويتك.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 border border-[var(--color-border)] bg-white p-4 font-bold"><input type="radio" name="identityVisible" value="true" required /> نعم، أظهري اسمي</label>
          <label className="flex cursor-pointer items-center gap-3 border border-[var(--color-border)] bg-white p-4 font-bold"><input type="radio" name="identityVisible" value="false" required /> لا، أرسليه مجهولًا</label>
        </div>
        {state.error === "identityVisible" ? <p role="alert" className="mt-3 font-bold text-[var(--color-error-text)]">{errors.identityVisible}</p> : null}
      </fieldset>
      {state.error === "save" ? <p role="alert" className="notice-error">{errors.save}</p> : null}
      {state.error === "turnstile" ? <p role="alert" className="notice-error">{errors.turnstile}</p> : null}
      <TurnstileField />
      <button type="submit" disabled={pending} className="button-primary px-6 py-3">{pending ? "جارٍ إرسال التقييم…" : "إرسال التقييم"}</button>
    </form>
  );
}
