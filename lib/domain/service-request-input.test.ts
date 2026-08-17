import { describe, expect, it } from "vitest";
import { validateServiceRequestInput } from "@/lib/domain/service-request-input";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("validateServiceRequestInput", () => {
  it("normalizes a space-booking request", () => {
    const result = validateServiceRequestInput(form({
      requesterName: "سارة أحمد",
      phone: "055 123 4567",
      email: "SARA@example.com",
      useOrOccasionType: "لقاء ثقافي",
      requestedDate: "2026-10-01",
      requestedStartTime: "17:00",
      requestedEndTime: "20:00",
      attendeeCount: "25",
    }), "space_booking");
    expect(result).toMatchObject({ ok: true, value: { phoneE164: "+966551234567", email: "sara@example.com" } });
  });

  it("rejects an invalid booking time range", () => {
    const result = validateServiceRequestInput(form({
      requesterName: "سارة أحمد",
      phone: "0551234567",
      useOrOccasionType: "لقاء ثقافي",
      requestedDate: "2026-10-01",
      requestedStartTime: "20:00",
      requestedEndTime: "17:00",
      attendeeCount: "25",
    }), "celebration_booking");
    expect(result).toEqual({ ok: false, error: "requestedTime" });
  });

  it("requires the approved workshop fields", () => {
    const result = validateServiceRequestInput(form({
      requesterName: "سارة أحمد",
      phone: "0551234567",
      workshopTitle: "فن الحكي",
      workshopDescription: "ورشة عملية لتجربة الحكي أمام مجموعة صغيرة.",
      workshopTargetAudience: "اليافعات",
      workshopDuration: "ساعتان",
      workshopExpectedAttendance: "18",
      workshopRequirements: "قاعة ومقاعد",
      workshopPortfolioUrl: "https://example.com/portfolio",
    }), "workshop_application");
    expect(result).toMatchObject({ ok: true, value: { workshop: { title: "فن الحكي" } } });
  });

  it("normalizes Arabic-Indic numerals and time with single digit hour", () => {
    const result = validateServiceRequestInput(form({
      requesterName: "سارة أحمد",
      phone: "٩٦٦٥٥١٢٣٤٥٦٧",
      useOrOccasionType: "لقاء ثقافي",
      requestedDate: "2026-10-01",
      requestedStartTime: "9:00",
      requestedEndTime: "12:00",
      attendeeCount: "٢٥",
    }), "space_booking");
    expect(result).toEqual({
      ok: true,
      value: {
        requesterName: "سارة أحمد",
        phoneE164: "+966551234567",
        email: null,
        notes: null,
        booking: {
          useOrOccasionType: "لقاء ثقافي",
          requestedDate: "2026-10-01",
          requestedStartTime: "09:00",
          requestedEndTime: "12:00",
          attendeeCount: 25,
        },
        workshop: null,
      },
    });
  });

  it("rejects honeypot submission", () => {
    const result = validateServiceRequestInput(form({
      requesterName: "سارة أحمد",
      phone: "0551234567",
      useOrOccasionType: "لقاء ثقافي",
      requestedDate: "2026-10-01",
      requestedStartTime: "17:00",
      requestedEndTime: "20:00",
      attendeeCount: "25",
      website: "https://spam.example",
    }), "space_booking");
    expect(result).toEqual({ ok: false, error: "invalid" });
  });

  it("handles various Saudi phone formats via parseServiceRequestInput", () => {
    const result = validateServiceRequestInput(form({
      requesterName: "سارة أحمد",
      phone: "+966-055-123-4567",
      useOrOccasionType: "لقاء ثقافي",
      requestedDate: "2026-10-01",
      requestedStartTime: "17:00",
      requestedEndTime: "20:00",
      attendeeCount: "25",
    }), "space_booking");
    expect(result).toMatchObject({ ok: true, value: { phoneE164: "+966551234567" } });
  });
});
