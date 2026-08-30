import type { Event } from "@/lib/domain/types";

export type EventLifecycle = "cancelled" | "archived" | "draft" | "live" | "past" | "upcoming";

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

/** Derives the single lifecycle state an admin actually thinks in from an event's status and schedule. */
export function eventLifecycle(event: Event, now: Date): EventLifecycle {
  if (event.publicationStatus === "cancelled") return "cancelled";
  if (event.publicationStatus === "archived") return "archived";
  if (event.publicationStatus === "draft") return "draft";

  const nowMs = now.getTime();
  const startsAtMs = new Date(event.startsAt).getTime();
  const endsAtMs = event.endsAt !== null ? new Date(event.endsAt).getTime() : startsAtMs + DEFAULT_DURATION_MS;

  if (nowMs >= endsAtMs) return "past";
  if (nowMs >= startsAtMs) return "live";
  return "upcoming";
}

export const eventLifecycleLabels: Record<EventLifecycle, string> = {
  cancelled: "ملغاة",
  archived: "مؤرشفة",
  draft: "مسودة",
  live: "مباشرة الآن",
  past: "منتهية",
  upcoming: "قادمة",
};

export const eventLifecycleTone: Record<EventLifecycle, "positive" | "warning" | "neutral" | "danger"> = {
  cancelled: "danger",
  archived: "neutral",
  draft: "neutral",
  live: "warning",
  past: "neutral",
  upcoming: "positive",
};
