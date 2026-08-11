"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { EventPosterActionState } from "@/app/(dashboard)/admin/(protected)/events/actions";

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

  useEffect(() => {
    if (state.saved) router.refresh();
  }, [router, state.saved]);

  return (
    <section className="mt-8 grid max-w-4xl gap-5 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-8">
      <div>
        <h2 className="text-xl font-extrabold text-[var(--brand-green-deep)]">بوستر الفعالية</h2>
        <p className="mt-2 text-sm muted-copy">اختياري. يقبل PNG أو JPG أو WebP، ويظهر للزائرات مع تفاصيل الفعالية.</p>
      </div>
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={`البوستر الحالي لفعالية ${eventTitle}`}
          width={960}
          height={540}
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="aspect-video w-full max-w-xl rounded-2xl object-cover"
        />
      ) : null}
      <form action={formAction} className="grid gap-4">
        <label className="grid gap-2 font-bold" htmlFor="event-poster">
          {posterUrl ? "استبدال البوستر" : "إضافة بوستر"}
          <input
            id="event-poster"
            name="poster"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block w-full rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm"
            required
          />
        </label>
        {state.error ? <p role="alert" className="font-bold text-[var(--color-error-text)]">{errorMessages[state.error]}</p> : null}
        {state.saved ? <p role="status" className="font-bold text-[var(--color-success-text)]">تم رفع البوستر وتحديث الصفحة.</p> : null}
        <button type="submit" disabled={pending} className="w-fit rounded-2xl bg-[var(--brand-green)] px-5 py-3 font-extrabold text-white disabled:opacity-65">
          {pending ? "جارٍ رفع البوستر…" : posterUrl ? "استبدال البوستر" : "رفع البوستر"}
        </button>
      </form>
    </section>
  );
}
