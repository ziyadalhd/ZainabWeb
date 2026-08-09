const dateTimeFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Riyadh",
});

const numberFormatter = new Intl.NumberFormat("ar-SA");

const timeFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Riyadh",
});

const currencyFormatter = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
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

export function formatArabicNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatArabicTime(value: string | Date): string {
  return timeFormatter.format(typeof value === "string" ? new Date(value) : value);
}

export function formatEventPrice(priceHalalas: number | null): string {
  if (priceHalalas === null) return "السعر غير محدد";
  if (priceHalalas === 0) return "مجانية";
  return currencyFormatter.format(priceHalalas / 100);
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
