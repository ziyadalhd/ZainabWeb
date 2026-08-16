"use client";

import { useId, useState } from "react";
import { ArabicDatePicker } from "@/features/scheduling/components/ArabicDatePicker";
import { TimeChoice } from "@/features/scheduling/components/TimeChoice";
import { formatArabicEventDate, formatArabicTimeInput } from "@/lib/format/date";
import { dateTimeLocalValue, parseDateInput, roundTimeToNearestQuarter } from "@/lib/scheduling";

export function OptionalDateTimePicker({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const controlId = useId();
  const originalDate = defaultValue?.slice(0, 10) ?? "";
  const originalTime = defaultValue?.slice(11, 16) ?? "";
  const roundedTime = roundTimeToNearestQuarter(originalTime || "18:00");
  const [customExpiry, setCustomExpiry] = useState(false);
  const [date, setDate] = useState(defaultValue?.slice(0, 10) ?? "");
  const [time, setTime] = useState(roundedTime);
  const selectedDate = parseDateInput(date);
  const originalDateValue = parseDateInput(originalDate);
  const roundedExistingTime = Boolean(defaultValue && originalTime !== roundedTime);

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
          <span className="block font-extrabold text-[var(--brand-forest)]">{defaultValue ? "تغيير موعد انتهاء العرض" : "تحديد موعد انتهاء مختلف"}</span>
          <span className="mt-1 block text-xs font-normal muted-copy">
            {defaultValue ? "اتركيه كما هو للاحتفاظ بالموعد الحالي." : "بدون اختيار، ينتهي العرض تلقائيًا بعد ٤٨ ساعة."}
          </span>
        </span>
      </label>
      {!customExpiry && defaultValue && originalDateValue ? (
        <p className="date-time-preview">
          الموعد الحالي: {formatArabicEventDate(originalDateValue)} · {formatArabicTimeInput(originalTime)}
        </p>
      ) : null}
      {customExpiry ? (
        <div className="grid gap-4 border-r-4 border-[var(--brand-amber)] pr-4">
          <ArabicDatePicker id={`${name}-${controlId}-date`} label="يوم انتهاء العرض" value={date} onChange={setDate} />
          {date ? <TimeChoice id={`${name}-${controlId}-time`} label="وقت انتهاء العرض" value={time} onChange={setTime} /> : null}
          <p className="date-time-preview" aria-live="polite">
            {selectedDate ? <>ينتهي العرض {formatArabicEventDate(selectedDate)} · {formatArabicTimeInput(time)}</> : "اختاري اليوم لعرض موعد انتهاء العرض هنا."}
          </p>
          {roundedExistingTime ? <p className="text-xs font-bold text-[var(--color-warning-text)]">قُرّب الوقت السابق إلى أقرب ربع ساعة. يمكنك اختيار وقت آخر قبل الحفظ.</p> : null}
        </div>
      ) : null}
      <input
        name={name}
        type="hidden"
        value={customExpiry ? (date ? dateTimeLocalValue(date, time) : "invalid") : (defaultValue ?? "")}
        readOnly
      />
    </div>
  );
}
