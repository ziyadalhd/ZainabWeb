"use client";

import { useActionState } from "react";
import type { SiteSettings } from "@/lib/domain/types";
import type { SiteSettingsActionState } from "@/app/(dashboard)/admin/(protected)/content/actions";

const inputClassName = "field-control bg-white";

const errors: Record<NonNullable<SiteSettingsActionState["error"]>, string> = {
  phone: "رقم التواصل يجب أن يكون رقم جوال سعوديًا من ١٠ أرقام ويبدأ بـ ٠٥.",
  url: "أدخل رابطًا صحيحًا يبدأ بـ http:// أو https://، أو اترك الحقل فارغًا لإخفائه.",
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
    <form action={formAction} className="form-surface mt-8 grid max-w-5xl gap-8 p-5 sm:p-8" noValidate>
      {state.error ? (
        <p role="alert" className="notice-error">
          {errors[state.error]}
        </p>
      ) : null}
      {state.saved ? (
        <p role="status" className="notice-success">
          تم حفظ محتوى الموقع.
        </p>
      ) : null}
      <fieldset className="grid gap-5">
        <legend className="mb-2 border-r-4 border-[var(--brand-olive)] pr-3 text-xl font-bold text-[var(--brand-forest)]">تعريف النادي</legend>
        <label className="grid gap-2 font-medium">
          عن النادي
          <textarea name="clubIntroduction" defaultValue={settings.clubIntroduction ?? ""} maxLength={4000} rows={4} className={inputClassName} />
        </label>
        <label className="grid gap-2 font-medium">
          فكرة اسم بَيْن
          <textarea name="nameStory" defaultValue={settings.nameStory ?? ""} maxLength={4000} rows={4} className={inputClassName} />
        </label>
        <label className="grid gap-2 font-medium">
          أهداف النادي
          <textarea name="objectives" defaultValue={settings.objectives ?? ""} maxLength={4000} rows={4} className={inputClassName} />
        </label>
      </fieldset>
      <fieldset className="grid gap-5 border-t border-[var(--border)] pt-7">
        <legend className="mb-2 border-r-4 border-[var(--brand-olive)] pr-3 text-xl font-bold text-[var(--brand-forest)]">التواصل والمقر</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 font-medium">
            رقم التواصل
            <input
              name="contactPhone"
              type="tel"
              inputMode="numeric"
              dir="ltr"
              defaultValue={settings.contactPhone ?? ""}
              maxLength={10}
              className={inputClassName}
            />
          </label>
          <label className="grid gap-2 font-medium">
            اسم المقر الافتراضي
            <input name="defaultVenueName" defaultValue={settings.defaultVenueName ?? ""} maxLength={250} className={inputClassName} />
          </label>
        </div>
        <label className="grid gap-2 font-medium">
          عنوان المقر
          <textarea name="defaultVenueAddress" defaultValue={settings.defaultVenueAddress ?? ""} maxLength={500} rows={3} className={inputClassName} />
        </label>
        <label className="grid gap-2 font-medium">
          رابط المقر في الخرائط
          <input name="defaultVenueMapUrl" type="url" dir="ltr" defaultValue={settings.defaultVenueMapUrl ?? ""} maxLength={2048} className={inputClassName} />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 font-medium">
            رابط Instagram
            <input name="instagramUrl" type="url" dir="ltr" defaultValue={settings.instagramUrl ?? ""} className={inputClassName} />
          </label>
          <label className="grid gap-2 font-medium">
            رابط TikTok
            <input name="tiktokUrl" type="url" dir="ltr" defaultValue={settings.tiktokUrl ?? ""} className={inputClassName} />
          </label>
        </div>
      </fieldset>
      <fieldset className="grid gap-5 border-t border-[var(--border)] pt-7">
        <legend className="mb-2 border-r-4 border-[var(--brand-olive)] pr-3 text-xl font-bold text-[var(--brand-forest)]">الشريك الأدبي</legend>
        <label className="grid gap-2 font-medium">
          العنوان
          <input name="literaryPartnerTitle" defaultValue={settings.literaryPartnerTitle ?? ""} maxLength={250} className={inputClassName} />
        </label>
        <label className="grid gap-2 font-medium">
          المحتوى
          <textarea name="literaryPartnerBody" defaultValue={settings.literaryPartnerBody ?? ""} maxLength={4000} rows={6} className={inputClassName} />
        </label>
      </fieldset>
      <button type="submit" disabled={pending} className="button-primary w-fit px-6 py-3">
        {pending ? "جارٍ الحفظ…" : "حفظ محتوى الموقع"}
      </button>
    </form>
  );
}
