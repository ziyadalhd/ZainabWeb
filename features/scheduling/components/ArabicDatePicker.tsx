"use client";

import { useId, useState } from "react";
import { DayPicker } from "@daypicker/react";
import { arSA } from "@daypicker/react/locale";
import { formatArabicEventDate } from "@/lib/format/date";
import { formatDateInput, parseDateInput } from "@/lib/scheduling";

interface ArabicDatePickerProps {
  id: string;
  label: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function ArabicDatePicker({ id, label, name, value, onChange, required = false }: ArabicDatePickerProps) {
  const [open, setOpen] = useState(false);
  const regionId = useId();
  const selected = parseDateInput(value);

  return (
    <div className="grid gap-2">
      <span id={`${id}-label`} className="text-sm font-bold">{label}</span>
      <button
        id={id}
        type="button"
        className="field-control flex items-center justify-between gap-3 bg-white text-start"
        aria-expanded={open}
        aria-controls={regionId}
        aria-labelledby={`${id}-label ${id}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? "font-extrabold text-[var(--brand-forest)]" : "muted-copy"}>
          {selected ? formatArabicEventDate(selected) : "اختاري اليوم والتاريخ"}
        </span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div id={regionId} className="bayn-calendar" role="region" aria-label={`تقويم ${label}`}>
          <DayPicker
            mode="single"
            dir="rtl"
            locale={arSA}
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              if (!date) return;
              onChange(formatDateInput(date));
              setOpen(false);
            }}
            showOutsideDays
            fixedWeeks
          />
        </div>
      ) : null}
      {name ? <input name={name} type="hidden" value={value} required={required} readOnly /> : null}
    </div>
  );
}
