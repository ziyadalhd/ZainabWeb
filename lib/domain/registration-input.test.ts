import { describe, expect, it } from "vitest";
import {
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
    expect(normalizeSaudiMobile("00966501234567")).toBe("+966501234567");
    expect(normalizeSaudiMobile("05123")).toBeNull();
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

  it("rejects the honeypot field", () => {
    const automated = validFormData();
    automated.set("website", "https://spam.example");
    expect(validateRegistrationInput(automated, "adults")).toEqual({
      ok: false,
      error: "invalid",
    });
  });
});
