"use client";

const minuteChoices = [
  { value: "00", label: "تمام" },
  { value: "15", label: "وربع" },
  { value: "30", label: "ونصف" },
  { value: "45", label: "إلا ربع" },
] as const;

function readTime(value: string): { hour12: number; minute: string; period: "am" | "pm" } {
  const [rawHour = "18", rawMinute = "00"] = value.split(":");
  const hour24 = Number(rawHour);
  return {
    hour12: hour24 % 12 || 12,
    minute: minuteChoices.some((choice) => choice.value === rawMinute) ? rawMinute : "00",
    period: hour24 >= 12 ? "pm" : "am",
  };
}

function toTime(hour12: number, minute: string, period: "am" | "pm"): string {
  const hour24 = period === "am" ? hour12 % 12 : (hour12 % 12) + 12;
  return `${String(hour24).padStart(2, "0")}:${minute}`;
}

interface TimeChoiceProps {
  id: string;
  label: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function TimeChoice({ id, label, name, value, onChange, required = false }: TimeChoiceProps) {
  const time = readTime(value || "18:00");
  const update = (next: Partial<typeof time>) => onChange(toTime(
    next.hour12 ?? time.hour12,
    next.minute ?? time.minute,
    next.period ?? time.period,
  ));

  return (
    <fieldset className="time-choice" aria-labelledby={`${id}-legend`}>
      <legend id={`${id}-legend`} className="text-sm font-bold">{label}</legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-xs font-bold" htmlFor={`${id}-hour`}>
          الساعة
          <select id={`${id}-hour`} className="field-control min-h-11 bg-white data-value" value={time.hour12} onChange={(event) => update({ hour12: Number(event.target.value) })}>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => <option key={hour} value={hour}>{hour}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-bold" htmlFor={`${id}-period`}>
          الفترة
          <select id={`${id}-period`} className="field-control min-h-11 bg-white" value={time.period} onChange={(event) => update({ period: event.target.value as "am" | "pm" })}>
            <option value="am">صباحًا</option>
            <option value="pm">مساءً</option>
          </select>
        </label>
      </div>
      <div className="minute-choice-grid mt-3" role="group" aria-label={`${label} — الدقائق`}>
        {minuteChoices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            className={`minute-choice ${time.minute === choice.value ? "minute-choice--selected" : ""}`}
            aria-pressed={time.minute === choice.value}
            onClick={() => update({ minute: choice.value })}
          >
            <span className="data-value">{choice.value}</span>
            <span>{choice.label}</span>
          </button>
        ))}
      </div>
      {name ? <input name={name} type="hidden" value={value} required={required} readOnly /> : null}
    </fieldset>
  );
}
