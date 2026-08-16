"use client";

import { useId, useState } from "react";
import { ArabicDatePicker } from "@/features/scheduling/components/ArabicDatePicker";
import { TimeChoice } from "@/features/scheduling/components/TimeChoice";
import { formatArabicEventDate, formatArabicTimeInput } from "@/lib/format/date";
import { dateTimeLocalValue, parseDateInput } from "@/lib/scheduling";

export function OptionalDateTimePicker({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const controlId = useId();
  const [customExpiry, setCustomExpiry] = useState(Boolean(defaultValue));
  const [date, setDate] = useState(defaultValue?.slice(0, 10) ?? "");
  const [time, setTime] = useState(defaultValue?.slice(11, 16) ?? "18:00");
  const selectedDate = parseDateInput(date);

  return (
    <div className="grid gap-4">
      <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white p-3">
        <input
          type="checkbox"
          className="mt-1 size-5 accent-[var(--brand-forest)]"
          checked={customExpiry}
          onChange={(event) => setCustomExpiry(event.target.checked)}
        />
        <span>
          <span className="block font-extrabold text-[var(--brand-forest)]">تحديد موعد انتهاء مختلف</span>
          <span className="mt-1 block text-xs font-normal muted-copy">بدون اختيار، ينتهي العرض تلقائيًا بعد ٤٨ ساعة.</span>
        </span>
      </label>
      {customExpiry ? (
        <div className="grid gap-4 border-r-4 border-[var(--brand-amber)] pr-4">
          <ArabicDatePicker id={`${name}-${controlId}-date`} label="يوم انتهاء العرض" value={date} onChange={setDate} />
          {date ? <TimeChoice id={`${name}-${controlId}-time`} label="وقت انتهاء العرض" value={time} onChange={setTime} /> : null}
          <p className="date-time-preview" aria-live="polite">
            {selectedDate ? <>ينتهي العرض {formatArabicEventDate(selectedDate)} · {formatArabicTimeInput(time)}</> : "اختاري اليوم لعرض موعد انتهاء العرض هنا."}
          </p>
        </div>
      ) : null}
      <input
        name={name}
        type="hidden"
        value={customExpiry ? (date ? dateTimeLocalValue(date, time) : "invalid") : ""}
        readOnly
      />
    </div>
  );
}
