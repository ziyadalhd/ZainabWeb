import { normalizeDigits, normalizeSaudiMobile } from "@/lib/domain/registration-input";
import type { ServiceRequestInput, ServiceRequestKind } from "@/lib/domain/types";

export type ServiceRequestInputError =
  | "requesterName"
  | "phone"
  | "email"
  | "useOrOccasionType"
  | "requestedDate"
  | "requestedTime"
  | "attendeeCount"
  | "workshopTitle"
  | "workshopDescription"
  | "workshopTargetAudience"
  | "workshopDuration"
  | "workshopExpectedAttendance"
  | "workshopRequirements"
  | "workshopPortfolioUrl"
  | "notes"
  | "invalid";

export type ServiceRequestInputResult =
  | { ok: true; value: ServiceRequestInput }
  | { ok: false; error: ServiceRequestInputError };

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function optionalText(formData: FormData, name: string): string | null {
  return text(formData, name) || null;
}

function positiveInteger(value: string): number | null {
  const normalized = normalizeDigits(value).trim();
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeTime(value: string): string | null {
  const normalized = normalizeDigits(value).trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(normalized);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizeDate(value: string): string | null {
  const normalized = normalizeDigits(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  return normalized;
}

function validEmail(value: string | null): boolean {
  return value === null || (value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

function validUrl(value: string | null): boolean {
  if (value === null) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isServiceRequestKind(value: string): value is ServiceRequestKind {
  return value === "space_booking" || value === "celebration_booking" || value === "workshop_application";
}

export function validateServiceRequestInput(
  formData: FormData,
  kind: ServiceRequestKind,
): ServiceRequestInputResult {
  const honeypot = text(formData, "website");
  if (honeypot) {
    console.error('[ServiceRequest Validation Failed] Honeypot "website" triggered with value:', honeypot);
    return { ok: false, error: "invalid" };
  }

  const requesterName = text(formData, "requesterName");
  if (requesterName.length < 2 || requesterName.length > 120) {
    console.error('[ServiceRequest Validation Failed] Invalid requesterName length:', requesterName.length, requesterName);
    return { ok: false, error: "requesterName" };
  }

  const rawPhone = text(formData, "phone");
  const phoneE164 = normalizeSaudiMobile(rawPhone);
  if (!phoneE164) {
    console.error('[ServiceRequest Validation Failed] Invalid phone format normalization:', rawPhone);
    return { ok: false, error: "phone" };
  }

  const email = optionalText(formData, "email")?.toLowerCase() ?? null;
  if (!validEmail(email)) {
    console.error('[ServiceRequest Validation Failed] Invalid email format:', email);
    return { ok: false, error: "email" };
  }

  const notes = optionalText(formData, "notes");
  if (notes !== null && notes.length > 4000) {
    console.error('[ServiceRequest Validation Failed] Notes length exceeds 4000 characters:', notes.length);
    return { ok: false, error: "notes" };
  }

  if (kind === "workshop_application") {
    const title = text(formData, "workshopTitle");
    const description = text(formData, "workshopDescription");
    const targetAudience = text(formData, "workshopTargetAudience");
    const duration = text(formData, "workshopDuration");
    const expectedAttendance = positiveInteger(text(formData, "workshopExpectedAttendance"));
    const requirements = text(formData, "workshopRequirements");
    const portfolioUrl = optionalText(formData, "workshopPortfolioUrl");
    if (title.length < 2 || title.length > 200) {
      console.error('[ServiceRequest Validation Failed] Invalid workshopTitle length:', title.length);
      return { ok: false, error: "workshopTitle" };
    }
    if (description.length < 2 || description.length > 4000) {
      console.error('[ServiceRequest Validation Failed] Invalid workshopDescription length:', description.length);
      return { ok: false, error: "workshopDescription" };
    }
    if (targetAudience.length < 2 || targetAudience.length > 200) {
      console.error('[ServiceRequest Validation Failed] Invalid workshopTargetAudience length:', targetAudience.length);
      return { ok: false, error: "workshopTargetAudience" };
    }
    if (duration.length < 1 || duration.length > 160) {
      console.error('[ServiceRequest Validation Failed] Invalid workshopDuration length:', duration.length);
      return { ok: false, error: "workshopDuration" };
    }
    if (expectedAttendance === null) {
      console.error('[ServiceRequest Validation Failed] Invalid workshopExpectedAttendance:', text(formData, "workshopExpectedAttendance"));
      return { ok: false, error: "workshopExpectedAttendance" };
    }
    if (requirements.length < 1 || requirements.length > 2000) {
      console.error('[ServiceRequest Validation Failed] Invalid workshopRequirements length:', requirements.length);
      return { ok: false, error: "workshopRequirements" };
    }
    if (!validUrl(portfolioUrl)) {
      console.error('[ServiceRequest Validation Failed] Invalid workshopPortfolioUrl:', portfolioUrl);
      return { ok: false, error: "workshopPortfolioUrl" };
    }
    return {
      ok: true,
      value: {
        requesterName,
        phoneE164,
        email,
        notes,
        booking: null,
        workshop: { title, description, targetAudience, duration, expectedAttendance, requirements, portfolioUrl },
      },
    };
  }

  const useOrOccasionType = text(formData, "useOrOccasionType");
  const rawDate = text(formData, "requestedDate");
  const requestedDate = normalizeDate(rawDate);
  const rawStartTime = text(formData, "requestedStartTime");
  const requestedStartTime = normalizeTime(rawStartTime);
  const rawEndTime = text(formData, "requestedEndTime");
  const requestedEndTime = normalizeTime(rawEndTime);
  const rawAttendeeCount = text(formData, "attendeeCount");
  const attendeeCount = positiveInteger(rawAttendeeCount);

  if (useOrOccasionType.length < 2 || useOrOccasionType.length > 160) {
    console.error('[ServiceRequest Validation Failed] Invalid useOrOccasionType length:', useOrOccasionType.length);
    return { ok: false, error: "useOrOccasionType" };
  }
  if (!requestedDate) {
    console.error('[ServiceRequest Validation Failed] Invalid requestedDate:', rawDate);
    return { ok: false, error: "requestedDate" };
  }
  if (!requestedStartTime || !requestedEndTime || requestedStartTime >= requestedEndTime) {
    console.error('[ServiceRequest Validation Failed] Invalid requestedTime range:', {
      rawStartTime,
      rawEndTime,
      requestedStartTime,
      requestedEndTime,
    });
    return { ok: false, error: "requestedTime" };
  }
  if (attendeeCount === null) {
    console.error('[ServiceRequest Validation Failed] Invalid attendeeCount:', rawAttendeeCount);
    return { ok: false, error: "attendeeCount" };
  }
  return {
    ok: true,
    value: {
      requesterName,
      phoneE164,
      email,
      notes,
      booking: { useOrOccasionType, requestedDate, requestedStartTime, requestedEndTime, attendeeCount },
      workshop: null,
    },
  };
}

export const parseServiceRequestInput = validateServiceRequestInput;
