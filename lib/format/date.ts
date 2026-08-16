const dateTimeFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Riyadh",
});

const eventDateFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Riyadh",
});

const numberFormatter = new Intl.NumberFormat("ar-SA");

const timeFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Riyadh",
});

const priceFormatter = new Intl.NumberFormat("ar-SA", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const riyadhPartsFormatter = new Intl.DateTimeFormat("en-CA-u-ca-gregory", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Riyadh",
});

export interface RiyadhDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function formatArabicDateTime(value: string | Date): string {
  return dateTimeFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function formatArabicEventDate(value: string | Date): string {
  return eventDateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function formatArabicEventTimeRange(startsAt: string | Date, endsAt?: string | Date | null): string {
  const start = getRiyadhDateParts(startsAt);
  const startClock = formatArabicClock(start);
  const startPeriod = periodLabel(start.hour);
  if (!endsAt) return `${startClock} ${startPeriod}`;

  const end = getRiyadhDateParts(endsAt);
  const endClock = formatArabicClock(end);
  const endPeriod = periodLabel(end.hour);
  return startPeriod === endPeriod
    ? `من ${startClock} إلى ${endClock} ${endPeriod}`
    : `من ${startClock} ${startPeriod} إلى ${endClock} ${endPeriod}`;
}

export function formatArabicTimeInput(value: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return value;
  return `${formatArabicClock({ hour, minute })} ${periodLabel(hour)}`;
}

function formatArabicClock({ hour, minute }: Pick<RiyadhDateParts, "hour" | "minute">): string {
  const hour12 = hour % 12 || 12;
  if (minute === 0) return formatArabicNumber(hour12);
  return `${formatArabicNumber(hour12)}:${formatArabicNumber(minute).padStart(2, "٠")}`;
}

function periodLabel(hour: number): "صباحًا" | "مساءً" {
  return hour < 12 ? "صباحًا" : "مساءً";
}

function localRiyadhDateTime(date: string, time: string): Date | null {
  const normalizedTime = time.slice(0, 5);
  const value = new Date(`${date}T${normalizedTime}:00+03:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export function formatArabicRequestedSchedule(date: string | null, start: string | null, end: string | null): string {
  if (!date || !start || !end) return "الموعد غير مكتمل";
  const startsAt = localRiyadhDateTime(date, start);
  const endsAt = localRiyadhDateTime(date, end);
  if (!startsAt || !endsAt) return "الموعد غير مكتمل";
  return `${formatArabicEventDate(startsAt)} · ${formatArabicEventTimeRange(startsAt, endsAt)}`;
}

export function formatArabicNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatSeatCapacity(value: number): string {
  if (value === 1) return "مقعد واحد";
  if (value === 2) return "مقعدان";
  if (value >= 3 && value <= 10) return `${formatArabicNumber(value)} مقاعد`;
  return `${formatArabicNumber(value)} مقعدًا`;
}

export function formatArabicTime(value: string | Date): string {
  return timeFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function formatEventPrice(priceHalalas: number | null): string {
  if (priceHalalas === null) return "السعر غير محدد";
  if (priceHalalas === 0) return "مجانية";
  return `${priceFormatter.format(priceHalalas / 100)} ريال`;
}

export function getRiyadhDateParts(value: string | Date): RiyadhDateParts {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = Object.fromEntries(
    riyadhPartsFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function formatRiyadhDateTimeLocal(value: string | Date): string {
  const { year, month, day, hour, minute } = getRiyadhDateParts(value);
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

export function formatRiyadhDateInput(value: string | Date): string {
  return formatRiyadhDateTimeLocal(value).slice(0, 10);
}

export function formatRiyadhTimeInput(value: string | Date): string {
  return formatRiyadhDateTimeLocal(value).slice(11, 16);
}
