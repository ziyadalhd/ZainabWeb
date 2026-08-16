const dateInputPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const timeInputPattern = /^([01]\d|2[0-3]):(00|15|30|45)$/;

export function parseDateInput(value: string): Date | undefined {
  const match = dateInputPattern.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  if (
    date.getFullYear() !== Number(match[1])
    || date.getMonth() !== Number(match[2]) - 1
    || date.getDate() !== Number(match[3])
  ) return undefined;
  return date;
}

export function formatDateInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDaysToDateInput(value: string, days: number): string {
  const date = parseDateInput(value);
  if (!date) return value;
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
}

export function addMinutesToSchedule(date: string, time: string, minutes: number): { date: string; time: string } {
  if (!parseDateInput(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { date, time };
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  const dayOffset = Math.floor(total / (24 * 60));
  const normalized = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
  return {
    date: addDaysToDateInput(date, dayOffset),
    time: `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`,
  };
}

export function isQuarterHourTime(value: string): boolean {
  return timeInputPattern.test(value);
}

export function roundTimeToNearestQuarter(value: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return value;

  const minutes = Number(match[1]) * 60 + Number(match[2]);
  const rounded = Math.round(minutes / 15) * 15;
  const normalized = rounded % (24 * 60);
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

export function dateTimeLocalValue(date: string, time: string): string {
  return date && time ? `${date}T${time}` : "";
}
