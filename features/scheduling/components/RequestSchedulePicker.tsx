"use client";

import { useState } from "react";
import { formatArabicEventDate, formatArabicEventTimeRange } from "@/lib/format/date";
import { addMinutesToSchedule } from "@/lib/scheduling";
import { ArabicDatePicker } from "@/features/scheduling/components/ArabicDatePicker";
import { TimeChoice } from "@/features/scheduling/components/TimeChoice";

function preview(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const result = new Date(`${date}T${time}:00+03:00`);
  return Number.isNaN(result.getTime()) ? null : result;
}

export function RequestSchedulePicker() {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [endTouched, setEndTouched] = useState(false);
  const start = preview(date, startTime);
  const end = preview(date, endTime);

  return (
    <fieldset className="date-time-choice grid gap-5">
      <legend className="px-2 font-black text-[var(--brand-forest)]">متى يناسبك؟</legend>
      <p className="text-sm muted-copy">اختاري اليوم والوقت المناسبين لك، وبنراجع الموعد معك قبل تأكيد الطلب.</p>
      <ArabicDatePicker id="request-date" label="اليوم والتاريخ" name="requestedDate" value={date} onChange={setDate} required />
      <div className="grid gap-5 md:grid-cols-2">
        <TimeChoice id="request-start" label="من الساعة" name="requestedStartTime" value={startTime} onChange={(value) => {
          setStartTime(value);
          if (!endTouched) {
            const suggested = addMinutesToSchedule(date || "2000-01-01", value, 120);
            setEndTime(suggested.date === (date || "2000-01-01") ? suggested.time : "23:45");
          }
        }} required />
        <TimeChoice id="request-end" label="إلى الساعة" name="requestedEndTime" value={endTime} onChange={(value) => { setEndTime(value); setEndTouched(true); }} required />
      </div>
      <p className="date-time-preview data-value" aria-live="polite">
        {start && end ? <>{formatArabicEventDate(start)} · {formatArabicEventTimeRange(start, end)}</> : "بعد اختيار اليوم يظهر لك الموعد كاملًا هنا."}
      </p>
    </fieldset>
  );
}
