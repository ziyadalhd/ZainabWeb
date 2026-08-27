import { getRiyadhDateParts } from "@/lib/format/date";

const monthPattern = /^(\d{4})-(\d{2})$/;

export function getCalendarMonth(value: string | undefined): Date {
  const match = value ? monthPattern.exec(value) : null;
  if (!match) {
    const current = getRiyadhDateParts(new Date());
    return new Date(Date.UTC(current.year, current.month - 1, 15, 12));
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 2020 || year > 2100 || month < 1 || month > 12) return new Date();
  return new Date(Date.UTC(year, month - 1, 15, 12));
}

export function monthHref(basePath: string, extraParams: Record<string, string>, month: Date, offset: number): string {
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth() + offset;
  const target = new Date(Date.UTC(year, monthIndex, 15, 12));
  const params = new URLSearchParams(extraParams);
  params.set("month", `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}`);
  return `${basePath}?${params.toString()}`;
}
