"use client";

import { useId, useRef, useState } from "react";
import { DayPicker } from "@daypicker/react";
import { arSA } from "@daypicker/react/locale";
import { formatArabicEventDate } from "@/lib/format/date";
import { formatDateInput, parseDateInput } from "@/lib/scheduling";

const weekdayLabels = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"] as const;

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selected = parseDateInput(value);

  return (
    <div className="grid gap-2">
      <span id={`${id}-label`} className="text-sm font-bold">{label}</span>
      <button
        ref={buttonRef}
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
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 fill-none stroke-current" strokeWidth="1.8">
          <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
        </svg>
      </button>
      {open ? (
        <div
          id={regionId}
          className="bayn-calendar"
          role="region"
          aria-label={`تقويم ${label}`}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            setOpen(false);
            buttonRef.current?.focus();
          }}
        >
          <DayPicker
            mode="single"
            dir="rtl"
            locale={arSA}
            numerals="arab"
            navLayout="after"
            labels={{
              labelPrevious: () => "الشهر السابق",
              labelNext: () => "الشهر التالي",
            }}
            formatters={{
              formatWeekdayName: (date) => weekdayLabels[date.getDay()],
            }}
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
