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
  const requesterName = text(formData, "requesterName") || "زائرة";

  const rawPhone = text(formData, "phone");
  const phoneE164 = normalizeSaudiMobile(rawPhone) || "+966500000000";

  const rawEmail = optionalText(formData, "email")?.toLowerCase() ?? null;
  const email = rawEmail && rawEmail.includes("@") && rawEmail.length <= 254 ? rawEmail : null;

  const notes = optionalText(formData, "notes")?.slice(0, 4000) ?? null;

  if (kind === "workshop_application") {
    const title = text(formData, "workshopTitle") || "طلب ورشة عمل";
    const description = text(formData, "workshopDescription") || "لا يوجد وصف إضافي";
    const targetAudience = text(formData, "workshopTargetAudience") || "عام";
    const duration = text(formData, "workshopDuration") || "ساعتان";
    const expectedAttendance = positiveInteger(text(formData, "workshopExpectedAttendance")) ?? 10;
    const requirements = text(formData, "workshopRequirements") || "لا يوجد";
    const portfolioUrl = optionalText(formData, "workshopPortfolioUrl");
    const validPortfolio = validUrl(portfolioUrl) ? portfolioUrl : null;

    return {
      ok: true,
      value: {
        requesterName,
        phoneE164,
        email,
        notes,
        booking: null,
        workshop: {
          title,
          description,
          targetAudience,
          duration,
          expectedAttendance,
          requirements,
          portfolioUrl: validPortfolio,
        },
      },
    };
  }

  const useOrOccasionType = text(formData, "useOrOccasionType") || "طلب حجز";
  const rawDate = text(formData, "requestedDate");
  const requestedDate = normalizeDate(rawDate) || new Date().toISOString().slice(0, 10);
  const rawStartTime = text(formData, "requestedStartTime");
  let requestedStartTime = normalizeTime(rawStartTime) || "17:00";
  const rawEndTime = text(formData, "requestedEndTime");
  let requestedEndTime = normalizeTime(rawEndTime) || "20:00";

  if (requestedStartTime >= requestedEndTime) {
    const startHour = Number(requestedStartTime.slice(0, 2));
    const nextHour = Math.min(23, startHour + 2);
    requestedEndTime = `${String(nextHour).padStart(2, "0")}:00`;
    if (requestedStartTime >= requestedEndTime) {
      requestedStartTime = "09:00";
      requestedEndTime = "12:00";
    }
  }

  const rawAttendeeCount = text(formData, "attendeeCount");
  const attendeeCount = positiveInteger(rawAttendeeCount) ?? 1;

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
