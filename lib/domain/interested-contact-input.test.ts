import { describe, expect, it } from "vitest";
import { validateInterestedContactInput } from "@/lib/domain/interested-contact-input";

function validFormData() {
  const formData = new FormData();
  formData.set("contactName", "  مهتمة بالنادي ");
  formData.set("phone", "0501234567");
  formData.set("email", " Interested@Example.com ");
  formData.set("upcomingEventsConsent", "on");
  return formData;
}

describe("interested contact input", () => {
  it("requires and normalizes the approved name, Saudi mobile, and email fields", () => {
    expect(validateInterestedContactInput(validFormData())).toEqual({
      ok: true,
      value: {
        contactName: "مهتمة بالنادي",
        phoneE164: "+966501234567",
        email: "interested@example.com",
      },
    });
  });

  it("requires explicit consent and a valid email", () => {
    const noConsent = validFormData();
    noConsent.delete("upcomingEventsConsent");
    expect(validateInterestedContactInput(noConsent)).toEqual({ ok: false, error: "consent" });
    const noEmail = validFormData();
    noEmail.set("email", "");
    expect(validateInterestedContactInput(noEmail)).toEqual({ ok: false, error: "email" });
  });

  it("matches the database name limits before attempting to save", () => {
    const tooShort = validFormData();
    tooShort.set("contactName", "أ");
    expect(validateInterestedContactInput(tooShort)).toEqual({ ok: false, error: "contactName" });

    const tooLong = validFormData();
    tooLong.set("contactName", "أ".repeat(121));
    expect(validateInterestedContactInput(tooLong)).toEqual({ ok: false, error: "contactName" });
  });

  it("does not reject submissions with a website field", () => {
    const formData = validFormData();
    formData.set("website", "https://spam.example");
    expect(validateInterestedContactInput(formData)).toMatchObject({ ok: true });
  });
});
