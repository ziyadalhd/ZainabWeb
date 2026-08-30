import { formatArabicEventDate, formatDayCount, formatHourCount, formatMinuteCount, getRiyadhDateParts } from "@/lib/format/date";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// Every caller here governs the noun after "خلال" or "منذ", which puts a dual count in the
// accusative/genitive case ("خلال ساعتين", "منذ يومين") rather than the nominative dual
// ("ساعتان", "يومان") that lib/format/date's counters return for subject-position use elsewhere.
// Singular, 3-10 and 11+ forms are case-invariant here, so only the dual needs overriding.
function magnitudeLabel(diffMs: number): string {
  const magnitude = Math.abs(diffMs);
  if (magnitude < HOUR_MS) {
    const minutes = Math.max(1, Math.round(magnitude / MINUTE_MS));
    return minutes === 2 ? "دقيقتين" : formatMinuteCount(minutes);
  }
  if (magnitude < DAY_MS) {
    const hours = Math.max(1, Math.round(magnitude / HOUR_MS));
    return hours === 2 ? "ساعتين" : formatHourCount(hours);
  }
  const days = Math.max(1, Math.round(magnitude / DAY_MS));
  return days === 2 ? "يومين" : formatDayCount(days);
}

/** "خلال ٤٠ دقيقة" for a deadline still ahead of `nowMs`, at minute precision under an hour. */
export function formatDeadlineLabel(deadlineMs: number, nowMs: number): string {
  const remaining = deadlineMs - nowMs;
  if (remaining <= 0) return "الموعد حان الآن";
  return `خلال ${magnitudeLabel(remaining)}`;
}

/** "منذ يومين" for a moment already in the past relative to `nowMs`. */
export function formatElapsedLabel(sinceMs: number, nowMs: number): string {
  const elapsed = nowMs - sinceMs;
  if (elapsed <= 0) return "الآن";
  return `منذ ${magnitudeLabel(elapsed)}`;
}

function riyadhDayNumber(value: string | Date): number {
  const parts = getRiyadhDateParts(value);
  return Date.UTC(parts.year, parts.month - 1, parts.day) / DAY_MS;
}

/** "اليوم" / "غدًا" for an event on the current or next Riyadh calendar day; the full Arabic date otherwise. */
export function formatRelativeEventDay(value: string, nowMs: number): string {
  const dayDiff = riyadhDayNumber(value) - riyadhDayNumber(new Date(nowMs));
  if (dayDiff === 0) return "اليوم";
  if (dayDiff === 1) return "غدًا";
  return formatArabicEventDate(value);
}
