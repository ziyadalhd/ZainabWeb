"use client";

import { useState } from "react";
import { ArabicDatePicker } from "@/features/scheduling/components/ArabicDatePicker";
import { TimeChoice } from "@/features/scheduling/components/TimeChoice";
import { dateTimeLocalValue } from "@/lib/scheduling";

export function OptionalDateTimePicker({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const [date, setDate] = useState(defaultValue?.slice(0, 10) ?? "");
  const [time, setTime] = useState(defaultValue?.slice(11, 16) ?? "18:00");

  return (
    <div className="grid gap-4">
      <ArabicDatePicker id={`${name}-date`} label="اليوم والتاريخ" value={date} onChange={setDate} />
      {date ? <TimeChoice id={`${name}-time`} label="الوقت" value={time} onChange={setTime} /> : null}
      {date ? <button type="button" className="button-quiet w-fit text-sm" onClick={() => setDate("")}>استخدام المدة الافتراضية (٤٨ ساعة)</button> : null}
      <input name={name} type="hidden" value={dateTimeLocalValue(date, time)} readOnly />
    </div>
  );
}
