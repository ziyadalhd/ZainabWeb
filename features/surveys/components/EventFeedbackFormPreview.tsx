const ratings = [5, 4, 3, 2, 1] as const;

function RatingField({ name, legend }: { name: string; legend: string }) {
  return (
    <fieldset>
      <legend className="font-extrabold text-[var(--brand-green-deep)]">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-3" dir="ltr">
        {ratings.map((rating) => (
          <label key={rating} className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-white font-bold has-checked:border-[var(--brand-green)] has-checked:bg-[var(--brand-green)] has-checked:text-[var(--brand-ivory)]">
            <input type="radio" name={name} value={rating} className="sr-only" />
            {rating}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function EventFeedbackFormPreview() {
  return (
    <form className="card-surface mt-10 grid gap-8 p-6 sm:p-8" aria-describedby="feedback-disclaimer">
      <RatingField name="hospitalityRating" legend="تقييم الضيافة" />
      <RatingField name="materialRating" legend="تقييم المادة" />
      <label className="grid gap-3 font-extrabold text-[var(--brand-green-deep)]">
        المقترحات
        <textarea name="suggestions" rows={5} className="resize-y rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal text-[var(--text)]" />
      </label>
      <p id="feedback-disclaimer" className="rounded-2xl bg-[var(--surface-soft)] p-4 text-sm muted-copy">
        هذه واجهة تجريبية، ولا يتم إرسال أو حفظ البيانات.
      </p>
      <button type="button" disabled className="cursor-not-allowed rounded-full bg-zinc-200 px-6 py-3 font-bold text-zinc-500">
        الإرسال غير متاح حاليًا
      </button>
    </form>
  );
}
