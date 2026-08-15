"use client";

import { useState } from "react";
import { formatArabicEventDate, formatArabicEventTimeRange } from "@/lib/format/date";
import { addMinutesToSchedule } from "@/lib/scheduling";
import { ArabicDatePicker } from "@/features/scheduling/components/ArabicDatePicker";
import { TimeChoice } from "@/features/scheduling/components/TimeChoice";

interface EventSchedulePickerProps {
  defaultStartDate?: string;
  defaultStartTime?: string;
  defaultEndDate?: string;
  defaultEndTime?: string;
  startError?: string;
  endError?: string;
  onValueChange?: () => void;
}

function preview(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}:00+03:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function EventSchedulePicker({ defaultStartDate = "", defaultStartTime = "18:00", defaultEndDate, defaultEndTime, startError, endError, onValueChange }: EventSchedulePickerProps) {
  const suggested = addMinutesToSchedule(defaultStartDate, defaultStartTime, 120);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endDate, setEndDate] = useState(defaultEndDate ?? suggested.date);
  const [endTime, setEndTime] = useState(defaultEndTime ?? suggested.time);
  const [differentDay, setDifferentDay] = useState(Boolean(defaultEndDate && defaultStartDate && defaultEndDate !== defaultStartDate));
  const [endTouched, setEndTouched] = useState(Boolean(defaultEndTime));
  const start = preview(startDate, startTime);
  const end = preview(endDate || startDate, endTime);

  function changeStartTime(value: string) {
    setStartTime(value);
    if (!endTouched) {
      const next = addMinutesToSchedule(startDate, value, 120);
      setEndTime(next.time);
      setEndDate(next.date);
      setDifferentDay(Boolean(next.date && startDate && next.date !== startDate));
    }
    onValueChange?.();
  }

  function changeStartDate(value: string) {
    setStartDate(value);
    if (!differentDay || !endTouched) {
      const next = addMinutesToSchedule(value, startTime, 120);
      setEndDate(differentDay ? next.date : value);
      if (!endTouched) setEndTime(next.time);
      if (!endTouched) setDifferentDay(next.date !== value);
    }
    onValueChange?.();
  }

  return (
    <section className="date-time-choice grid gap-6" aria-labelledby="event-schedule-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold tracking-[0.08em] text-[var(--brand-olive)]">الموعد</p>
          <h3 id="event-schedule-title" className="mt-1 text-xl font-black text-[var(--brand-forest)]">موعد الفعالية</h3>
        </div>
        <span className="date-time-timezone">توقيت السعودية</span>
      </div>

      <ArabicDatePicker id="event-start-date" label="اليوم والتاريخ" name="startDate" value={startDate} onChange={changeStartDate} required />
      <div className="grid gap-5 md:grid-cols-2">
        <TimeChoice id="event-start-time" label="تبدأ الساعة" name="startTime" value={startTime} onChange={changeStartTime} required />
        <TimeChoice id="event-end-time" label="تنتهي الساعة" name="endTime" value={endTime} onChange={(value) => { setEndTime(value); setEndTouched(true); onValueChange?.(); }} required />
      </div>

      <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-4 py-2 font-bold">
        <input type="checkbox" checked={differentDay} onChange={(event) => {
          const checked = event.target.checked;
          setDifferentDay(checked);
          setEndDate(checked ? (endDate || startDate) : startDate);
          onValueChange?.();
        }} />
        تنتهي في يوم مختلف
      </label>
      {differentDay ? <ArabicDatePicker id="event-end-date" label="تاريخ النهاية" value={endDate} onChange={(value) => { setEndDate(value); setEndTouched(true); onValueChange?.(); }} /> : null}
      <input name="endDate" type="hidden" value={differentDay ? endDate : startDate} required readOnly />

      <p className="date-time-preview data-value" aria-live="polite">
        {start && end ? <>{formatArabicEventDate(start)} · {formatArabicEventTimeRange(start, end)}</> : "اختاري اليوم لعرض الموعد كاملًا هنا."}
      </p>
      {startError ? <p className="text-sm font-bold text-[var(--color-error-text)]">{startError}</p> : null}
      {endError ? <p className="text-sm font-bold text-[var(--color-error-text)]">{endError}</p> : null}
    </section>
  );
}
