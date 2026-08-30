import { buildCalendarItems } from "@/features/admin/calendar-items";
import type { AdminServiceRequest, Event, EventAudience } from "@/lib/domain/types";
import { formatArabicNumber, formatArabicTime, getRiyadhDateParts } from "@/lib/format/date";

export interface PulseItem {
  id: string;
  href: string;
  timeLabel: string;
  title: string;
  isEvent: boolean;
  audience: EventAudience | null;
  capacityLabel: string | null;
  conflictCount: number;
}

const dayPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses a `?day=YYYY-MM-DD` value, falling back to today in Riyadh for a missing or malformed one. */
export function getSelectedDay(value: string | undefined, now: number): Date {
  const match = value ? dayPattern.exec(value) : null;
  if (!match) {
    const today = getRiyadhDateParts(new Date(now));
    return new Date(Date.UTC(today.year, today.month - 1, today.day, 12));
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day, 12));
  if (Number.isNaN(candidate.getTime()) || candidate.getUTCDate() !== day) return getSelectedDay(undefined, now);
  return candidate;
}

export function formatDayParam(day: Date): string {
  return `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(day.getUTCDate()).padStart(2, "0")}`;
}

export function dayHref(basePath: string, extraParams: Record<string, string>, day: Date, offsetDays: number): string {
  const target = new Date(day.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams(extraParams);
  params.set("day", formatDayParam(target));
  return `${basePath}?${params.toString()}`;
}

/** The seven calendar days of the week containing `day`, Saturday first — the Saudi week order the design uses. */
export function weekOf(day: Date): readonly Date[] {
  const offsetFromSaturday = (day.getUTCDay() + 1) % 7;
  const saturday = new Date(day.getTime() - offsetFromSaturday * 24 * 60 * 60 * 1000);
  return Array.from({ length: 7 }, (_, index) => new Date(saturday.getTime() + index * 24 * 60 * 60 * 1000));
}

export function isSameDay(first: Date, second: Date): boolean {
  return first.getUTCFullYear() === second.getUTCFullYear() && first.getUTCMonth() === second.getUTCMonth() && first.getUTCDate() === second.getUTCDate();
}

export function buildDayPulseItems(
  events: readonly Event[],
  requests: readonly AdminServiceRequest[],
  day: Date,
  eventBaseHref = "/admin/events",
): readonly PulseItem[] {
  const dayParts = { year: day.getUTCFullYear(), month: day.getUTCMonth() + 1, day: day.getUTCDate() };
  return buildCalendarItems(events, requests, eventBaseHref)
    .filter((item) => {
      const parts = getRiyadhDateParts(item.startsAt);
      return parts.year === dayParts.year && parts.month === dayParts.month && parts.day === dayParts.day;
    })
    .map((item) => ({
      id: item.id,
      href: item.href,
      timeLabel: formatArabicTime(item.startsAt),
      title: item.title,
      isEvent: item.kind === "event",
      audience: item.audience ?? null,
      capacityLabel:
        item.kind === "event" && item.capacity !== undefined && item.activeReservationCount !== undefined
          ? `${formatArabicNumber(item.activeReservationCount)}/${formatArabicNumber(item.capacity)}`
          : null,
      conflictCount: item.conflictCount,
    }));
}
