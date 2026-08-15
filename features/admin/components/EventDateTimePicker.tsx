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
  onValueChange?: () => void;
}

const quarterMinutes = ["00", "15", "30", "45"] as const;

function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

function splitTime(value: string | undefined): { hour: string; minute: string } {
  const [hour = "18", minute = "00"] = value?.split(":") ?? [];
  return { hour: /^\d{2}$/.test(hour) ? hour : "18", minute: /^\d{2}$/.test(minute) ? minute : "00" };
}

function minuteLabel(minute: string): string {
  if (minute === "00") return "تمام";
  if (minute === "15") return "وربع";
  if (minute === "30") return "ونصف";
  if (minute === "45") return "إلا ربع";
  return `${minute} دقيقة`;
}

export function EventDateTimePicker({ id, label, dateName, timeName, defaultDate, defaultTime, error, onValueChange }: EventDateTimePickerProps) {
  const initialTime = splitTime(defaultTime);
  const [dateValue, setDateValue] = useState(defaultDate ?? "");
  const [hourValue, setHourValue] = useState(initialTime.hour);
  const [minuteValue, setMinuteValue] = useState(initialTime.minute);
  const timeValue = `${hourValue}:${minuteValue}`;
  const preview = new Date(`${dateValue}T${timeValue}:00+03:00`);
  const shownMinutes = quarterMinutes.includes(minuteValue as (typeof quarterMinutes)[number])
    ? quarterMinutes
    : [...quarterMinutes, minuteValue] as const;

  return (
    <section className="date-time-choice" aria-labelledby={`${id}-label`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold tracking-[0.08em] text-[var(--brand-olive)]">الموعد</p>
          <h3 id={`${id}-label`} className="mt-1 text-xl font-black text-[var(--brand-forest)]">{label}</h3>
        </div>
        <span className="date-time-timezone">توقيت السعودية</span>
      </div>

      <label className="mt-5 grid gap-2 text-sm font-bold" htmlFor={`${id}-date`}>
        اليوم والتاريخ
        <input
          id={`${id}-date`}
          className="field-control date-time-date-input bg-white"
          name={dateName}
          type="date"
          value={dateValue}
          onChange={(event) => {
            setDateValue(event.target.value);
            onValueChange?.();
          }}
          required
        />
      </label>

      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <label className="grid gap-2 text-sm font-bold" htmlFor={`${id}-hour`}>
          الساعة
          <select
            id={`${id}-hour`}
            className="field-control bg-white data-value"
            value={hourValue}
            onChange={(event) => {
              setHourValue(event.target.value);
              onValueChange?.();
            }}
            dir="ltr"
          >
            {Array.from({ length: 24 }, (_, hour) => {
              const value = String(hour).padStart(2, "0");
              return <option key={value} value={value}>{value}</option>;
            })}
          </select>
        </label>

        <fieldset className="min-w-0">
          <legend className="text-sm font-bold">الدقائق</legend>
          <div className="minute-choice-grid mt-2" role="group" aria-label={`${label} — الدقائق`}>
            {shownMinutes.map((minute) => (
              <button
                key={minute}
                type="button"
                className={`minute-choice ${minuteValue === minute ? "minute-choice--selected" : ""}`}
                aria-pressed={minuteValue === minute}
                onClick={() => {
                  setMinuteValue(minute);
                  onValueChange?.();
                }}
              >
                <span className="data-value">{minute}</span>
                <span>{minuteLabel(minute)}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs muted-copy">اختيارات سريعة كل ربع ساعة.</p>
        </fieldset>
      </div>

      <input name={timeName} type="hidden" value={timeValue} readOnly />
      <p className="date-time-preview data-value mt-5" aria-live="polite">
        {isValidDate(preview) ? <>{formatArabicEventDate(preview)} · {formatArabicTime(preview)}</> : "اختاري التاريخ والوقت لعرض الموعد هنا."}
      </p>
      {error ? <p className="mt-3 text-sm font-bold text-[var(--color-error-text)]">{error}</p> : null}
    </section>
  );
}
