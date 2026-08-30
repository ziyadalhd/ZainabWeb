"use client";

import { useState } from "react";
import { formatArabicEventDate, formatArabicEventTimeRange, formatEventDuration } from "@/lib/format/date";
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
  /** ISO date (YYYY-MM-DD) before which the start date cannot be picked. Pass today's Riyadh date on create; omit on edit so a past event stays correctable. */
  minStartDate?: string;
}

function preview(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}:00+03:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function EventSchedulePicker({ defaultStartDate = "", defaultStartTime = "18:00", defaultEndDate, defaultEndTime, startError, endError, onValueChange, minStartDate }: EventSchedulePickerProps) {
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

  const duration = start && end ? formatEventDuration(start, end) : "";

  return (
    <section className="date-time-choice grid gap-6" aria-labelledby="event-schedule-title">
      <div>
        <h3 id="event-schedule-title" className="text-xl font-black text-[var(--brand-forest)]">اختاري اليوم والوقت</h3>
        <p className="mt-2 max-w-2xl text-sm leading-7 muted-copy">بعد اختيار البداية نقترح نهاية بعد ساعتين، وتقدرين تعدلينها مباشرة.</p>
      </div>

      <ArabicDatePicker id="event-start-date" label="اليوم والتاريخ" name="startDate" value={startDate} onChange={changeStartDate} minDate={minStartDate} required />
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
      {differentDay ? (
        <ArabicDatePicker
          id="event-end-date"
          label="تاريخ النهاية"
          value={endDate}
          onChange={(value) => { setEndDate(value); setEndTouched(true); onValueChange?.(); }}
          minDate={startDate || undefined}
        />
      ) : (
        <p className="field-control flex items-center justify-between gap-3 bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]" aria-live="polite">
          <span>تاريخ النهاية</span>
          <span className="font-bold text-[var(--brand-forest)]">{start ? formatArabicEventDate(start) : "— نفس تاريخ البداية"}</span>
        </p>
      )}
      <input name="endDate" type="hidden" value={differentDay ? endDate : startDate} required readOnly />

      <p className="date-time-preview" aria-live="polite">
        {start && end ? (
          <>
            {formatArabicEventDate(start)} · {formatArabicEventTimeRange(start, end)}
            {duration ? <> · المدة {duration}</> : null}
            <span className="date-time-timezone">توقيت السعودية</span>
          </>
        ) : (
          "اختاري اليوم لعرض الموعد كاملًا هنا."
        )}
      </p>
      {startError ? <p className="text-sm font-bold text-[var(--color-error-text)]">{startError}</p> : null}
      {endError ? <p className="text-sm font-bold text-[var(--color-error-text)]">{endError}</p> : null}
    </section>
  );
}
