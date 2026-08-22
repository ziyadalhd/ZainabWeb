import { describe, expect, it } from "vitest";
import {
  isRegistrationCheckInStatus,
  isRegistrationPaymentStatus,
  normalizeSaudiMobile,
  validateRegistrationInput,
} from "@/lib/domain/registration-input";

function validFormData() {
  const formData = new FormData();
  formData.set("attendeeName", "  زائر النادي  ");
  formData.set("phone", "٠٥٠ ١٢٣ ٤٥٦٧");
  formData.set("email", " Visitor@Example.com ");
  return formData;
}

describe("registration input", () => {
  it("normalizes supported Saudi mobile formats", () => {
    expect(normalizeSaudiMobile("0501234567")).toBe("+966501234567");
    expect(normalizeSaudiMobile("+966 50 123 4567")).toBe("+966501234567");
    expect(normalizeSaudiMobile("+966-050-123-4567")).toBe("+966501234567");
    expect(normalizeSaudiMobile("00966501234567")).toBe("+966501234567");
    expect(normalizeSaudiMobile("009660501234567")).toBe("+966501234567");
    expect(normalizeSaudiMobile("966501234567")).toBe("+966501234567");
    expect(normalizeSaudiMobile("9660501234567")).toBe("+966501234567");
    expect(normalizeSaudiMobile("501234567")).toBe("+966501234567");
    expect(normalizeSaudiMobile("05.01.23.45.67")).toBe("+966501234567");
    expect(normalizeSaudiMobile("\u200E+966 50 123 4567")).toBe("+966501234567");
    expect(normalizeSaudiMobile("05123")).toBeNull();
    expect(normalizeSaudiMobile("05012345678")).toBeNull();
    expect(normalizeSaudiMobile("+966 55 123 4567 ext")).toBe("+966551234567");
    expect(normalizeSaudiMobile("")).toBeNull();
  });

  it("recognizes only the approved check-in outcomes", () => {
    expect(isRegistrationCheckInStatus("pending")).toBe(true);
    expect(isRegistrationCheckInStatus("checked_in")).toBe(true);
    expect(isRegistrationCheckInStatus("absent")).toBe(true);
    expect(isRegistrationCheckInStatus("paid")).toBe(false);
  });

  it("recognizes only the approved manual payment states", () => {
    expect(isRegistrationPaymentStatus("unpaid")).toBe(true);
    expect(isRegistrationPaymentStatus("deposit_paid")).toBe(true);
    expect(isRegistrationPaymentStatus("paid_in_full")).toBe(true);
    expect(isRegistrationPaymentStatus("paid")).toBe(false);
  });

  it("trims fields and keeps email optional", () => {
    expect(validateRegistrationInput(validFormData(), "adults")).toEqual({
      ok: true,
      value: {
        attendeeName: "زائر النادي",
        phoneE164: "+966501234567",
        email: "visitor@example.com",
        participantAge: null,
        guardianName: null,
        guardianConsent: false,
      },
    });
    const withoutEmail = validFormData();
    withoutEmail.set("email", "");
    expect(validateRegistrationInput(withoutEmail, "adults")).toMatchObject({
      ok: true,
      value: { email: null },
    });
  });

  it("matches the registration name boundary enforced by the database", () => {
    const tooShort = validFormData();
    tooShort.set("attendeeName", "ا");
    expect(validateRegistrationInput(tooShort, "adults")).toEqual({
      ok: false,
      error: "attendeeName",
    });
  });

  it("requires approved minor fields and age boundaries", () => {
    expect(validateRegistrationInput(validFormData(), "children")).toEqual({
      ok: false,
      error: "guardianName",
    });
    const approved = validFormData();
    approved.set("guardianName", "ولية الأمر");
    approved.set("participantAge", "١٢");
    approved.set("guardianConsent", "on");
    expect(validateRegistrationInput(approved, "children")).toMatchObject({
      ok: true,
      value: {
        participantAge: 12,
        guardianName: "ولية الأمر",
        guardianConsent: true,
      },
    });
    approved.set("participantAge", "13");
    expect(validateRegistrationInput(approved, "children")).toEqual({
      ok: false,
      error: "participantAge",
    });
    expect(validateRegistrationInput(approved, "youth")).toMatchObject({
      ok: true,
      value: { participantAge: 13 },
    });
  });

  it("does not reject submissions with a website field", () => {
    const automated = validFormData();
    automated.set("website", "https://spam.example");
    expect(validateRegistrationInput(automated, "adults")).toMatchObject({
      ok: true,
    });
  });
});
