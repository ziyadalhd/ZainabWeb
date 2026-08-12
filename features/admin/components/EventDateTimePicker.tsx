"use client";

import { useState } from "react";
import { formatArabicEventDate, formatArabicTime } from "@/lib/format/date";

interface EventDateTimePickerProps {
  id: string;
  label: string;
  dateName: string;
  timeName: string;
  defaultDate?: string;
  defaultTime?: string;
  error?: string;
}

function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

export function EventDateTimePicker({ id, label, dateName, timeName, defaultDate, defaultTime, error }: EventDateTimePickerProps) {
  const [dateValue, setDateValue] = useState(defaultDate ?? "");
  const [timeValue, setTimeValue] = useState(defaultTime ?? "18:00");
  const preview = new Date(`${dateValue}T${timeValue}:00+03:00`);

  return (
    <section className="date-time-choice" aria-labelledby={`${id}-label`}>
      <h3 id={`${id}-label`} className="font-black text-[var(--brand-forest)]">{label}</h3>
      <p className="mt-1 text-sm muted-copy">اختاري التاريخ، ثم حددي الوقت مباشرةً. الوقت بتوقيت السعودية.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <label className="grid gap-1 text-sm font-bold" htmlFor={`${id}-date`}>التاريخ
          <input id={`${id}-date`} className="field-control bg-white" name={dateName} type="date" value={dateValue} onChange={(event) => setDateValue(event.target.value)} required />
        </label>
        <label className="grid gap-1 text-sm font-bold" htmlFor={`${id}-time`}>الوقت
          <input id={`${id}-time`} className="field-control bg-white" name={timeName} type="time" step="900" value={timeValue} onChange={(event) => setTimeValue(event.target.value)} required dir="ltr" />
        </label>
      </div>
      <p className="date-time-preview data-value mt-4" aria-live="polite">
        {isValidDate(preview) ? <>{formatArabicEventDate(preview)} · {formatArabicTime(preview)}</> : "اختاري التاريخ والوقت لعرض الموعد هنا."}
      </p>
      {error ? <p className="mt-2 text-sm font-bold text-[var(--color-error-text)]">{error}</p> : null}
    </section>
  );
}
