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

export function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export function normalizeSaudiMobile(value: string): string | null {
  if (!value) return null;
  const converted = normalizeDigits(value);
  const digits = converted.replace(/\D/g, "");
  if (!digits) return null;

  if (/^0096605\d{8}$/.test(digits)) return `+966${digits.slice(6)}`;
  if (/^009665\d{8}$/.test(digits)) return `+966${digits.slice(5)}`;
  if (/^96605\d{8}$/.test(digits)) return `+966${digits.slice(4)}`;
  if (/^9665\d{8}$/.test(digits)) return `+966${digits.slice(3)}`;
  if (/^05\d{8}$/.test(digits)) return `+966${digits.slice(1)}`;
  if (/^5\d{8}$/.test(digits)) return `+966${digits}`;

  return null;
}

export function isRegistrationStatus(value: string): value is "registered" | "waitlisted" | "invited" | "cancelled" {
  return value === "registered" || value === "waitlisted" || value === "invited" || value === "cancelled";
}

export function isRegistrationAttendanceStatus(value: string): value is "pending" | "confirmed" {
  return value === "pending" || value === "confirmed";
}

export function isRegistrationCheckInStatus(value: string): value is "pending" | "checked_in" | "absent" {
  return value === "pending" || value === "checked_in" || value === "absent";
}

export function isRegistrationPaymentStatus(value: string): value is "unpaid" | "deposit_paid" | "paid_in_full" {
  return value === "unpaid" || value === "deposit_paid" || value === "paid_in_full";
}

/** The age band each minor audience covers. Adults never carry an age, so they are absent here. */
const minorAgeBands: Partial<Record<EventAudience, { min: number; max: number }>> = {
  children: { min: 6, max: 12 },
  youth: { min: 13, max: 17 },
};

export function allowsAdultRegistration(audiences: readonly EventAudience[]): boolean {
  return audiences.includes("adults");
}

export function allowsMinorRegistration(audiences: readonly EventAudience[]): boolean {
  return audiences.some((audience) => minorAgeBands[audience] !== undefined);
}

/** True when the age falls inside one of the event's own minor bands, not a span between them. */
export function isAgeWithinAudiences(age: number, audiences: readonly EventAudience[]): boolean {
  return audiences.some((audience) => {
    const band = minorAgeBands[audience];
    return band !== undefined && age >= band.min && age <= band.max;
  });
}

/** The widest age the form should offer, across whichever minor audiences the event serves. */
export function minorAgeRange(audiences: readonly EventAudience[]): { min: number; max: number } | null {
  const bands = audiences.map((audience) => minorAgeBands[audience]).filter((band) => band !== undefined);
  if (bands.length === 0) return null;
  return {
    min: Math.min(...bands.map((band) => band.min)),
    max: Math.max(...bands.map((band) => band.max)),
  };
}

export function validateRegistrationInput(
  formData: FormData,
  audiences: readonly EventAudience[],
): RegistrationInputResult {
  const attendeeName = String(formData.get("attendeeName") ?? "").trim();
  if (attendeeName.length < 2 || attendeeName.length > 120) {
    return { ok: false, error: "attendeeName" };
  }

  const phoneE164 = normalizeSaudiMobile(String(formData.get("phone") ?? ""));
  if (!phoneE164) return { ok: false, error: "phone" };

  const emailValue = String(formData.get("email") ?? "").trim().toLowerCase();
  if (emailValue && (emailValue.length > 254 || !emailValue.includes("@"))) {
    return { ok: false, error: "email" };
  }

  const guardianConsent = formData.get("guardianConsent") === "on";
  const ageText = normalizeDigits(String(formData.get("participantAge") ?? "").trim());

  // The shape of the submission says which kind of registration this is, matching the database
  // rule: an age is a minor's age, and an adult never carries one. An event that serves only
  // minors always takes the minor path, even when the age field came back empty.
  const isMinorRegistration = allowsMinorRegistration(audiences)
    && (!allowsAdultRegistration(audiences) || ageText !== "");

  if (!isMinorRegistration) {
    return {
      ok: true,
      value: {
        attendeeName,
        phoneE164,
        email: emailValue || null,
        participantAge: null,
        guardianName: null,
        guardianConsent: false,
      },
    };
  }

  const guardianName = String(formData.get("guardianName") ?? "").trim();
  if (guardianName.length < 2 || guardianName.length > 120) {
    return { ok: false, error: "guardianName" };
  }

  const participantAge = Number(ageText);
  const validAge = /^\d+$/.test(ageText)
    && Number.isSafeInteger(participantAge)
    && isAgeWithinAudiences(participantAge, audiences);
  if (!validAge) return { ok: false, error: "participantAge" };
  if (!guardianConsent) return { ok: false, error: "guardianConsent" };

  return {
    ok: true,
    value: {
      attendeeName,
      phoneE164,
      email: emailValue || null,
      participantAge,
      guardianName,
      guardianConsent,
    },
  };
}
