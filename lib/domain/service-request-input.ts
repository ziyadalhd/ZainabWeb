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
  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) return null;
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

export const approvedWorkshopAudiences = [
  "كبار (فوق ١٨)",
  "يافعين (من ١٢ إلى ١٨)",
  "صغار (أصغر من ١٢)",
] as const;

export type WorkshopAudience = (typeof approvedWorkshopAudiences)[number];

export function parseWorkshopAudienceList(value: string | string[]): WorkshopAudience[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is WorkshopAudience => approvedWorkshopAudiences.includes(v as WorkshopAudience));
  }
  return value
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter((s): s is WorkshopAudience => approvedWorkshopAudiences.includes(s as WorkshopAudience));
}

export function getWorkshopAudienceChips(audience: string | null | undefined): string[] {
  if (!audience) return [];
  const list = parseWorkshopAudienceList(audience);
  return list.length > 0 ? list : [audience];
}

export function isServiceRequestKind(value: string): value is ServiceRequestKind {
  return value === "space_booking" || value === "celebration_booking" || value === "workshop_application";
}

export function validateServiceRequestInput(
  formData: FormData,
  kind: ServiceRequestKind,
): ServiceRequestInputResult {
  const requesterName = text(formData, "requesterName");
  if (requesterName.length < 2 || requesterName.length > 120) {
    return { ok: false, error: "requesterName" };
  }

  const rawPhone = text(formData, "phone");
  const phoneE164 = normalizeSaudiMobile(rawPhone);
  if (!phoneE164) return { ok: false, error: "phone" };

  const rawEmail = optionalText(formData, "email")?.toLowerCase() ?? null;
  if (rawEmail && (rawEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail))) {
    return { ok: false, error: "email" };
  }
  const email = rawEmail;

  const notes = optionalText(formData, "notes");
  if (notes && notes.length > 4000) return { ok: false, error: "notes" };

  if (kind === "workshop_application") {
    const title = text(formData, "workshopTitle");
    if (title.length < 2 || title.length > 200) return { ok: false, error: "workshopTitle" };
    const description = text(formData, "workshopDescription");
    if (description.length < 2 || description.length > 4000) {
      return { ok: false, error: "workshopDescription" };
    }
    const rawAudienceValues = formData.getAll("workshopTargetAudience").map(String).filter(Boolean);
    const parsedAudienceList = parseWorkshopAudienceList(rawAudienceValues);
    if (parsedAudienceList.length === 0) {
      return { ok: false, error: "workshopTargetAudience" };
    }
    const targetAudience = parsedAudienceList.join("، ");
    if (targetAudience.length < 2 || targetAudience.length > 200) {
      return { ok: false, error: "workshopTargetAudience" };
    }
    const duration = text(formData, "workshopDuration");
    if (duration.length < 1 || duration.length > 160) return { ok: false, error: "workshopDuration" };
    const rawExpected = text(formData, "workshopExpectedAttendance");
    const expectedAttendance = positiveInteger(rawExpected);
    if (!expectedAttendance) return { ok: false, error: "workshopExpectedAttendance" };
    const requirements = text(formData, "workshopRequirements");
    if (requirements.length < 1 || requirements.length > 2000) {
      return { ok: false, error: "workshopRequirements" };
    }
    const portfolioUrl = optionalText(formData, "workshopPortfolioUrl");
    if (!validUrl(portfolioUrl)) return { ok: false, error: "workshopPortfolioUrl" };

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
          portfolioUrl,
        },
      },
    };
  }

  const useOrOccasionType = text(formData, "useOrOccasionType");
  if (useOrOccasionType.length < 2 || useOrOccasionType.length > 160) {
    return { ok: false, error: "useOrOccasionType" };
  }
  const rawDate = text(formData, "requestedDate");
  const requestedDate = normalizeDate(rawDate);
  if (!requestedDate) return { ok: false, error: "requestedDate" };
  const rawStartTime = text(formData, "requestedStartTime");
  const requestedStartTime = normalizeTime(rawStartTime);
  if (!requestedStartTime) return { ok: false, error: "requestedTime" };
  const rawEndTime = text(formData, "requestedEndTime");
  const requestedEndTime = normalizeTime(rawEndTime);
  if (!requestedEndTime || requestedStartTime >= requestedEndTime) {
    return { ok: false, error: "requestedTime" };
  }

  const rawAttendeeCount = text(formData, "attendeeCount");
  const attendeeCount = positiveInteger(rawAttendeeCount);
  if (!attendeeCount) return { ok: false, error: "attendeeCount" };

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
