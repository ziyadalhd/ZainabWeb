"use client";

import { useMemo, useState } from "react";
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

const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const pad = (value: number) => String(value).padStart(2, "0");

function dateDefaults(value?: string) {
  const [year, month, day] = (value ?? "").split("-").map(Number);
  const today = new Date();
  return {
    year: Number.isInteger(year) && year > 0 ? year : today.getFullYear(),
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : today.getMonth() + 1,
    day: Number.isInteger(day) && day >= 1 && day <= 31 ? day : today.getDate(),
  };
}

function timeDefaults(value?: string) {
  const [hour, minute] = (value ?? "").split(":").map(Number);
  return { hour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 18, minute: Number.isInteger(minute) && minute >= 0 && minute <= 59 ? minute : 0 };
}

export function EventDateTimePicker({ id, label, dateName, timeName, defaultDate, defaultTime, error }: EventDateTimePickerProps) {
  const initialDate = dateDefaults(defaultDate);
  const initialTime = timeDefaults(defaultTime);
  const [year, setYear] = useState(initialDate.year);
  const [month, setMonth] = useState(initialDate.month);
  const [day, setDay] = useState(initialDate.day);
  const [hour, setHour] = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const safeDay = Math.min(day, maxDay);
  const dateValue = `${year}-${pad(month)}-${pad(safeDay)}`;
  const timeValue = `${pad(hour)}:${pad(minute)}`;
  const years = useMemo(() => Array.from({ length: 12 }, (_, index) => new Date().getFullYear() - 1 + index), []);
  const preview = new Date(`${dateValue}T${timeValue}:00+03:00`);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4" aria-labelledby={`${id}-label`}>
      <h3 id={`${id}-label`} className="font-extrabold text-[var(--brand-green-deep)]">{label}</h3>
      <input type="hidden" name={dateName} value={dateValue} />
      <input type="hidden" name={timeName} value={timeValue} />
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.4fr_1fr]">
        <label className="grid gap-1 text-sm font-bold" htmlFor={`${id}-day`}>اليوم
          <select id={`${id}-day`} value={safeDay} onChange={(event) => setDay(Number(event.target.value))} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3">
            {Array.from({ length: maxDay }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold" htmlFor={`${id}-month`}>الشهر
          <select id={`${id}-month`} value={month} onChange={(event) => setMonth(Number(event.target.value))} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3">
            {monthNames.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold" htmlFor={`${id}-year`}>السنة
          <select id={`${id}-year`} value={year} onChange={(event) => setYear(Number(event.target.value))} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3">
            {years.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm font-bold" htmlFor={`${id}-hour`}>الساعة
          <select id={`${id}-hour`} value={hour} onChange={(event) => setHour(Number(event.target.value))} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3" dir="ltr">
            {Array.from({ length: 24 }, (_, index) => <option key={index} value={index}>{pad(index)}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold" htmlFor={`${id}-minute`}>الدقيقة
          <select id={`${id}-minute`} value={minute} onChange={(event) => setMinute(Number(event.target.value))} className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-3" dir="ltr">
            {Array.from({ length: 60 }, (_, index) => <option key={index} value={index}>{pad(index)}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-4 rounded-xl bg-white px-3 py-2 text-sm font-extrabold text-[var(--brand-green-deep)]" aria-live="polite">
        {formatArabicEventDate(preview)} · {formatArabicTime(preview)}
      </p>
      {error ? <p className="mt-2 text-sm font-bold text-[var(--color-error-text)]">{error}</p> : null}
    </section>
  );
}
