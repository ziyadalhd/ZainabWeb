import type {
  EventAudience,
  EventKind,
  EventInput,
  EventPublicationStatus,
  EventRegistrationStatus,
} from "@/lib/domain/types";

const audiences: readonly EventAudience[] = ["adults", "youth", "children"];
const eventKinds: readonly EventKind[] = ["club_event", "bayn_trip"];
const registrationStatuses: readonly EventRegistrationStatus[] = ["open", "closed"];
const publicationStatuses: readonly EventPublicationStatus[] = ["draft", "published", "archived", "cancelled"];

export type EventInputErrorCode =
  | "title"
  | "audience"
  | "kind"
  | "eventTypeLabel"
  | "startsAt"
  | "endsAt"
  | "capacity"
  | "priceHalalas"
  | "registrationStatus";

export type EventInputResult =
  | { ok: true; value: EventInput }
  | { ok: false; errors: readonly EventInputErrorCode[] };

export function isEventAudience(value: string): value is EventAudience {
  return audiences.includes(value as EventAudience);
}

export function isEventKind(value: string): value is EventKind {
  return eventKinds.includes(value as EventKind);
}

export function isEventRegistrationStatus(value: string): value is EventRegistrationStatus {
  return registrationStatuses.includes(value as EventRegistrationStatus);
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

export function riyadhDateAndTimeToIso(date: string, time: string): string | null {
  return riyadhDateTimeLocalToIso(`${date}T${time}`);
}

function normalizeArabicDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export function parsePriceSarToHalalas(value: string): number | null {
  const normalized = normalizeArabicDigits(value.trim()).replace(/[,٫]/, ".");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return null;

  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const halalas = whole * 100 + fraction;

  return Number.isSafeInteger(halalas) && halalas <= 2_147_483_647
    ? halalas
    : null;
}

export function validateEventInput(formData: FormData): EventInputResult {
  const errors: EventInputErrorCode[] = [];

  const title = String(formData.get("title") ?? "").trim();
  if (!title) errors.push("title");

  const audienceRaw = String(formData.get("audience") ?? "");
  const audience = isEventAudience(audienceRaw) ? audienceRaw : null;
  if (!audience) errors.push("audience");

  const kindRaw = String(formData.get("kind") ?? "");
  const kind = isEventKind(kindRaw) ? kindRaw : null;
  if (!kind) errors.push("kind");

  const eventTypeLabel = String(formData.get("eventTypeLabel") ?? "").trim();
  if (!eventTypeLabel) errors.push("eventTypeLabel");

  const startsAt = riyadhDateAndTimeToIso(
    String(formData.get("startDate") ?? ""),
    String(formData.get("startTime") ?? ""),
  );
  if (!startsAt) errors.push("startsAt");

  const endsAt = riyadhDateAndTimeToIso(
    String(formData.get("endDate") ?? ""),
    String(formData.get("endTime") ?? ""),
  );
  if (!endsAt || (startsAt && new Date(endsAt) <= new Date(startsAt))) {
    errors.push("endsAt");
  }

  const capacityText = normalizeArabicDigits(String(formData.get("capacity") ?? ""));
  const capacity = Number(capacityText);
  const capacityValid = /^\d+$/.test(capacityText) && Number.isSafeInteger(capacity) && capacity > 0 && capacity <= 50;
  if (!capacityValid) errors.push("capacity");

  const priceHalalas = parsePriceSarToHalalas(String(formData.get("priceSar") ?? ""));
  if (priceHalalas === null) errors.push("priceHalalas");

  const registrationStatusRaw = String(formData.get("registrationStatus") ?? "");
  const registrationStatus = isEventRegistrationStatus(registrationStatusRaw) ? registrationStatusRaw : null;
  if (!registrationStatus) errors.push("registrationStatus");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      title,
      kind: kind!,
      audience: audience!,
      eventTypeLabel,
      startsAt: startsAt!,
      endsAt: endsAt!,
      capacity,
      priceHalalas: priceHalalas!,
      registrationStatus: registrationStatus!,
    },
  };
}

const allowedTransitions: Record<EventPublicationStatus, readonly EventPublicationStatus[]> = {
  draft: ["published", "archived"],
  published: ["archived", "cancelled"],
  archived: ["draft", "cancelled"],
  cancelled: [],
};

export function canChangeEventStatus(
  from: EventPublicationStatus,
  to: EventPublicationStatus,
): boolean {
  return allowedTransitions[from].includes(to);
}
