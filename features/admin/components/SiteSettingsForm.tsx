"use client";

import { useActionState } from "react";
import type { SiteSettings } from "@/lib/domain/types";
import type { SiteSettingsActionState } from "@/app/(dashboard)/admin/(protected)/content/actions";

const inputClassName = "min-h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text)]";

const errors: Record<NonNullable<SiteSettingsActionState["error"]>, string> = {
  phone: "رقم التواصل يجب أن يكون رقم جوال سعوديًا من ١٠ أرقام ويبدأ بـ ٠٥.",
  socialUrl: "أدخل رابطًا صحيحًا يبدأ بـ http:// أو https://، أو اترك الحقل فارغًا لإخفائه.",
  text: "أحد الحقول أطول من الحد المسموح؛ اختصري النص ثم حاولي مرة أخرى.",
  save: "تعذر حفظ الإعدادات الآن. لم تُفقد البيانات؛ حاولي مرة أخرى.",
};

export function SiteSettingsForm({
  settings,
  action,
}: {
  settings: SiteSettings;
  action: (state: SiteSettingsActionState, formData: FormData) => Promise<SiteSettingsActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="mt-8 grid max-w-4xl gap-8 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-8" noValidate>
      {state.error ? <p role="alert" className="rounded-2xl bg-[var(--color-error-bg)] p-4 font-bold text-[var(--color-error-text)]">{errors[state.error]}</p> : null}
      {state.saved ? <p role="status" className="rounded-2xl bg-[var(--color-success-bg)] p-4 font-bold text-[var(--color-success-text)]">تم حفظ محتوى الموقع.</p> : null}
      <fieldset className="grid gap-5">
        <legend className="text-xl font-extrabold text-[var(--brand-green-deep)]">تعريف النادي</legend>
        <label className="grid gap-2 font-bold">عن النادي<textarea name="clubIntroduction" defaultValue={settings.clubIntroduction ?? ""} maxLength={4000} rows={4} className={inputClassName} /></label>
        <label className="grid gap-2 font-bold">فكرة اسم بَيْن<textarea name="nameStory" defaultValue={settings.nameStory ?? ""} maxLength={4000} rows={4} className={inputClassName} /></label>
        <label className="grid gap-2 font-bold">أهداف النادي<textarea name="objectives" defaultValue={settings.objectives ?? ""} maxLength={4000} rows={4} className={inputClassName} /></label>
      </fieldset>
      <fieldset className="grid gap-5 border-t border-[var(--border)] pt-7">
        <legend className="text-xl font-extrabold text-[var(--brand-green-deep)]">التواصل والمقر</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 font-bold">رقم التواصل<input name="contactPhone" type="tel" inputMode="numeric" dir="ltr" defaultValue={settings.contactPhone ?? ""} maxLength={10} className={inputClassName} /></label>
          <label className="grid gap-2 font-bold">اسم المقر الافتراضي<input name="defaultVenueName" defaultValue={settings.defaultVenueName ?? ""} maxLength={250} className={inputClassName} /></label>
        </div>
        <label className="grid gap-2 font-bold">عنوان المقر<textarea name="defaultVenueAddress" defaultValue={settings.defaultVenueAddress ?? ""} maxLength={500} rows={3} className={inputClassName} /></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 font-bold">رابط Instagram<input name="instagramUrl" type="url" dir="ltr" defaultValue={settings.instagramUrl ?? ""} className={inputClassName} /></label>
          <label className="grid gap-2 font-bold">رابط TikTok<input name="tiktokUrl" type="url" dir="ltr" defaultValue={settings.tiktokUrl ?? ""} className={inputClassName} /></label>
        </div>
      </fieldset>
      <fieldset className="grid gap-5 border-t border-[var(--border)] pt-7">
        <legend className="text-xl font-extrabold text-[var(--brand-green-deep)]">الشريك الأدبي</legend>
        <label className="grid gap-2 font-bold">العنوان<input name="literaryPartnerTitle" defaultValue={settings.literaryPartnerTitle ?? ""} maxLength={250} className={inputClassName} /></label>
        <label className="grid gap-2 font-bold">المحتوى<textarea name="literaryPartnerBody" defaultValue={settings.literaryPartnerBody ?? ""} maxLength={4000} rows={6} className={inputClassName} /></label>
      </fieldset>
      <button type="submit" disabled={pending} className="w-fit rounded-2xl bg-[var(--brand-green)] px-6 py-3 font-extrabold text-white disabled:opacity-65">{pending ? "جارٍ الحفظ…" : "حفظ محتوى الموقع"}</button>
    </form>
  );
}
