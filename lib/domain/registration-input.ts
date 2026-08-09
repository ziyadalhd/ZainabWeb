import type { EventAudience, RegistrationInput } from "@/lib/domain/types";

export type RegistrationInputErrorCode =
  | "attendeeName"
  | "phone"
  | "email"
  | "participantAge"
  | "guardianName"
  | "guardianConsent"
  | "invalid";

export type RegistrationInputResult =
  | { ok: true; value: RegistrationInput }
  | { ok: false; error: RegistrationInputErrorCode };

function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export function normalizeSaudiMobile(value: string): string | null {
  const compact = normalizeDigits(value).replace(/[\s()-]/g, "");
  const local = /^05\d{8}$/.test(compact)
    ? compact.slice(1)
    : /^5\d{8}$/.test(compact)
      ? compact
      : /^\+9665\d{8}$/.test(compact)
        ? compact.slice(4)
        : /^009665\d{8}$/.test(compact)
          ? compact.slice(5)
          : null;

  return local ? `+966${local}` : null;
}

export function isRegistrationStatus(value: string): value is "registered" | "waitlisted" | "invited" | "cancelled" {
  return value === "registered" || value === "waitlisted" || value === "invited" || value === "cancelled";
}

export function isRegistrationAttendanceStatus(value: string): value is "pending" | "confirmed" {
  return value === "pending" || value === "confirmed";
}

export function validateRegistrationInput(
  formData: FormData,
  audience: EventAudience,
): RegistrationInputResult {
  if (String(formData.get("website") ?? "")) {
    return { ok: false, error: "invalid" };
  }

  const attendeeName = String(formData.get("attendeeName") ?? "").trim();
  if (attendeeName.length < 2 || attendeeName.length > 120) {
    return { ok: false, error: "attendeeName" };
  }

  const phoneE164 = normalizeSaudiMobile(String(formData.get("phone") ?? ""));
  if (!phoneE164) return { ok: false, error: "phone" };

  const emailValue = String(formData.get("email") ?? "").trim().toLowerCase();
  if (
    emailValue
    && (
      emailValue.length > 254
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)
    )
  ) {
    return { ok: false, error: "email" };
  }

  const guardianConsent = formData.get("guardianConsent") === "on";
  let participantAge: number | null = null;
  let guardianName: string | null = null;

  if (audience !== "adults") {
    guardianName = String(formData.get("guardianName") ?? "").trim();
    if (guardianName.length < 2 || guardianName.length > 120) {
      return { ok: false, error: "guardianName" };
    }

    const ageText = normalizeDigits(String(formData.get("participantAge") ?? "").trim());
    participantAge = Number(ageText);
    const validAge = /^\d+$/.test(ageText)
      && Number.isSafeInteger(participantAge)
      && (audience === "children"
        ? participantAge >= 6 && participantAge <= 12
        : participantAge >= 13 && participantAge <= 17);
    if (!validAge) return { ok: false, error: "participantAge" };
    if (!guardianConsent) return { ok: false, error: "guardianConsent" };
  }

  return {
    ok: true,
    value: {
      attendeeName,
      phoneE164,
      email: emailValue || null,
      participantAge,
      guardianName,
      guardianConsent: audience !== "adults" && guardianConsent,
    },
  };
}
