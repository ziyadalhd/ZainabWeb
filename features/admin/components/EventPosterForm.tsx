"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { EventPosterActionState } from "@/app/(dashboard)/admin/(protected)/events/actions";
import { PosterFrame } from "@/components/ui/PosterFrame";

const errorMessages: Record<NonNullable<EventPosterActionState["error"]>, string> = {
  file: "اختر ملف صورة غير فارغ.",
  type: "استخدم صورة PNG أو JPG أو WebP فقط.",
  save: "تعذر رفع البوستر الآن. لم تُفقد الفعالية، حاولي مرة أخرى.",
};

export function EventPosterForm({
  eventTitle,
  posterUrl,
  action,
}: {
  eventTitle: string;
  posterUrl: string | null;
  action: (state: EventPosterActionState, formData: FormData) => Promise<EventPosterActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const router = useRouter();
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (state.saved) router.refresh();
  }, [router, state.saved]);

  useEffect(
    () => () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    },
    [localPreviewUrl],
  );

  const previewUrl = localPreviewUrl ?? posterUrl;

  return (
    <section className="form-surface mt-8 grid max-w-5xl gap-5 p-5 sm:p-8">
      <div>
        <h2 className="border-r-4 border-[var(--brand-olive)] pr-3 text-xl font-black text-[var(--brand-forest)]">بوستر الفعالية</h2>
        <p className="mt-2 text-sm muted-copy">اختياري. يقبل PNG أو JPG أو WebP، ويظهر للزائرات مع تفاصيل الفعالية.</p>
      </div>
      {previewUrl ? (
        <div className="grid gap-2">
          <p className="text-sm font-bold text-[var(--brand-forest)]">{localPreviewUrl ? "معاينة البوستر قبل الرفع" : "البوستر الحالي"}</p>
          <PosterFrame
            src={previewUrl}
            alt={`${localPreviewUrl ? "معاينة" : "البوستر الحالي"} لفعالية ${eventTitle}`}
            sizes="(min-width: 640px) 28rem, 100vw"
            className="aspect-[4/5] w-full max-w-md rounded-[var(--radius-surface)] border border-[var(--color-border)]"
          />
        </div>
      ) : null}
      <form action={formAction} className="grid gap-4">
        <label className="grid gap-2 font-bold" htmlFor="event-poster">
          {posterUrl ? "استبدال البوستر" : "إضافة بوستر"}
          <input
            id="event-poster"
            name="poster"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="field-control block text-sm"
            onChange={(event) => {
              if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
              const file = event.target.files?.[0];
              setLocalPreviewUrl(file ? URL.createObjectURL(file) : null);
            }}
            required
          />
        </label>
        {state.error ? (
          <p role="alert" className="font-bold text-[var(--color-error-text)]">
            {errorMessages[state.error]}
          </p>
        ) : null}
        {state.saved ? (
          <p role="status" className="font-bold text-[var(--color-success-text)]">
            تم رفع البوستر وتحديث الصفحة.
          </p>
        ) : null}
        <button type="submit" disabled={pending} className="button-primary w-fit px-5 py-3">
          {pending ? "جارٍ رفع البوستر…" : posterUrl ? "استبدال البوستر" : "رفع البوستر"}
        </button>
      </form>
    </section>
  );
}
