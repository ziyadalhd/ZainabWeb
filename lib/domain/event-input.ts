import type {
  EventAudience,
  EventAvailability,
  EventInput,
  EventPublicationStatus,
} from "@/lib/domain/types";

const audiences: readonly EventAudience[] = ["adults", "youth", "children"];
const availabilities: readonly EventAvailability[] = ["available", "full"];
const publicationStatuses: readonly EventPublicationStatus[] = ["draft", "published", "archived"];

export type EventInputErrorCode =
  | "title"
  | "audience"
  | "eventTypeLabel"
  | "startsAt"
  | "capacity"
  | "availability";

export type EventInputResult =
  | { ok: true; value: EventInput }
  | { ok: false; error: EventInputErrorCode };

export function isEventAudience(value: string): value is EventAudience {
  return audiences.includes(value as EventAudience);
}

export function isEventAvailability(value: string): value is EventAvailability {
  return availabilities.includes(value as EventAvailability);
}

export function isEventPublicationStatus(value: string): value is EventPublicationStatus {
  return publicationStatuses.includes(value as EventPublicationStatus);
}

export function riyadhDateTimeLocalToIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const timestamp = Date.UTC(year, month - 1, day, hour - 3, minute);
  const riyadhWallTime = new Date(timestamp + 3 * 60 * 60 * 1000);

  if (
    riyadhWallTime.getUTCFullYear() !== year
    || riyadhWallTime.getUTCMonth() !== month - 1
    || riyadhWallTime.getUTCDate() !== day
    || riyadhWallTime.getUTCHours() !== hour
    || riyadhWallTime.getUTCMinutes() !== minute
  ) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

export function validateEventInput(formData: FormData): EventInputResult {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "title" };

  const audience = String(formData.get("audience") ?? "");
  if (!isEventAudience(audience)) return { ok: false, error: "audience" };

  const eventTypeLabel = String(formData.get("eventTypeLabel") ?? "").trim();
  if (!eventTypeLabel) return { ok: false, error: "eventTypeLabel" };

  const startsAt = riyadhDateTimeLocalToIso(String(formData.get("startsAt") ?? ""));
  if (!startsAt) return { ok: false, error: "startsAt" };

  const capacityText = String(formData.get("capacity") ?? "");
  const capacity = Number(capacityText);
  if (!/^\d+$/.test(capacityText) || !Number.isSafeInteger(capacity) || capacity <= 0) {
    return { ok: false, error: "capacity" };
  }

  const availability = String(formData.get("availability") ?? "");
  if (!isEventAvailability(availability)) return { ok: false, error: "availability" };

  return {
    ok: true,
    value: { title, audience, eventTypeLabel, startsAt, capacity, availability },
  };
}

const allowedTransitions: Record<EventPublicationStatus, readonly EventPublicationStatus[]> = {
  draft: ["published", "archived"],
  published: ["archived"],
  archived: ["draft"],
};

export function canChangeEventStatus(
  from: EventPublicationStatus,
  to: EventPublicationStatus,
): boolean {
  return allowedTransitions[from].includes(to);
}
