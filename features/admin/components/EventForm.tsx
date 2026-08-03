import type { Event } from "@/lib/domain/types";
import { formatRiyadhDateTimeLocal } from "@/lib/format/date";

interface EventFormProps {
  action: (formData: FormData) => void | Promise<void>;
  event?: Event;
  errorMessage?: string;
  submitLabel: string;
}

export function EventForm({ action, event, errorMessage, submitLabel }: EventFormProps) {
  return (
    <form action={action} className="mt-8 grid max-w-3xl gap-6 rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
      {errorMessage ? <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 font-bold text-red-800">{errorMessage}</p> : null}
      <label className="grid gap-2 font-bold">عنوان الفعالية<input className="rounded-2xl border border-[var(--border)] px-4 py-3 font-normal" name="title" defaultValue={event?.title} required /></label>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="grid gap-2 font-bold">الفئة
          <select className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal" name="audience" defaultValue={event?.audience ?? "adults"}>
            <option value="adults">الكبار</option><option value="youth">اليافعون</option><option value="children">الصغار</option>
          </select>
        </label>
        <label className="grid gap-2 font-bold">نوع الفعالية<input className="rounded-2xl border border-[var(--border)] px-4 py-3 font-normal" name="eventTypeLabel" defaultValue={event?.eventTypeLabel} required /></label>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="grid gap-2 font-bold">التاريخ والوقت بتوقيت الرياض<input className="rounded-2xl border border-[var(--border)] px-4 py-3 font-normal" type="datetime-local" name="startsAt" defaultValue={event ? formatRiyadhDateTimeLocal(event.startsAt) : undefined} required /></label>
        <label className="grid gap-2 font-bold">السعة<input className="rounded-2xl border border-[var(--border)] px-4 py-3 font-normal" type="number" name="capacity" min="1" step="1" defaultValue={event?.capacity} required /></label>
      </div>
      <label className="grid gap-2 font-bold">حالة التوفر
        <select className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-normal" name="availability" defaultValue={event?.availability ?? "available"}>
          <option value="available">متاح</option><option value="full">مكتمل</option>
        </select>
        <span className="text-xs font-normal muted-copy">تُحدد هذه الحالة يدويًا ولا تُستنتج من السعة.</span>
      </label>
      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-5">
        <button type="submit" className="rounded-2xl bg-[var(--brand-green)] px-6 py-3 font-extrabold text-white">{submitLabel}</button>
        <span className="text-sm muted-copy">الحفظ لا ينشر الفعالية تلقائيًا.</span>
      </div>
    </form>
  );
}
