import { formatEventCount, formatTaskCount, getRiyadhDateParts } from "@/lib/format/date";

/** A time-of-day greeting in Riyadh local time — no name, since the admin identity carries no display name. */
export function buildGreeting(now: number): string {
  const { hour } = getRiyadhDateParts(new Date(now));
  return hour < 12 ? "صباح الخير" : "مساء الخير";
}

/**
 * A one-sentence summary of the day, built only from real counts. Every branch keeps numbered
 * counts in subject position ("أمامك اليوم فعاليتان") rather than as the object of a verb or
 * preposition — `formatEventCount`/`formatTaskCount` return the nominative dual ("فعاليتان") for a
 * count of two, which is only correct in that position; attaching a conjugated verb to a numbered
 * dual/plural noun ("فعاليتان تحتاج…") would need the verb or noun case to change with the count.
 */
export function buildDaySummary(eventCount: number, taskCount: number): string {
  if (eventCount === 0 && taskCount === 0) return "يوم هادئ — لا فعاليات ولا مهام تحتاج عنايتك.";
  if (taskCount === 0) return `أمامك اليوم ${formatEventCount(eventCount)}، ولا مهام تحتاج عنايتك الآن.`;
  if (eventCount === 0) return `لا فعاليات مجدولة اليوم، وأمامك ${formatTaskCount(taskCount)}.`;
  return `أمامك اليوم ${formatEventCount(eventCount)} و${formatTaskCount(taskCount)}.`;
}
