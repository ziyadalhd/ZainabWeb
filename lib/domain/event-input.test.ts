import { describe, expect, it } from "vitest";
import {
  canChangeEventStatus,
  parsePriceSarToHalalas,
  riyadhDateTimeLocalToIso,
  validateEventInput,
} from "@/lib/domain/event-input";

function validFormData() {
  const formData = new FormData();
  formData.set("title", "  لقاء القراءة  ");
  formData.set("kind", "club_event");
  formData.set("audience", "adults");
  formData.set("eventTypeLabel", " لقاء ");
  formData.set("startDate", "2026-08-10");
  formData.set("startTime", "18:00");
  formData.set("endDate", "2026-08-10");
  formData.set("endTime", "20:00");
  formData.set("capacity", "20");
  formData.set("priceSar", "75.50");
  formData.set("registrationStatus", "open");
  return formData;
}

describe("event input", () => {
  it("converts Riyadh local time to UTC", () => {
    expect(riyadhDateTimeLocalToIso("2026-08-10T18:00")).toBe("2026-08-10T15:00:00.000Z");
    expect(riyadhDateTimeLocalToIso("2026-02-30T18:00")).toBeNull();
  });

  it("trims text and validates all allowlists", () => {
    expect(validateEventInput(validFormData())).toEqual({
      ok: true,
      value: {
        title: "لقاء القراءة",
        kind: "club_event",
        audience: "adults",
        eventTypeLabel: "لقاء",
        startsAt: "2026-08-10T15:00:00.000Z",
        endsAt: "2026-08-10T17:00:00.000Z",
        capacity: 20,
        priceHalalas: 7550,
        registrationStatus: "open",
      },
    });
    const invalid = validFormData();
    invalid.set("audience", "all");
    expect(validateEventInput(invalid)).toEqual({ ok: false, error: "audience" });
    invalid.set("audience", "adults");
    invalid.set("kind", "other");
    expect(validateEventInput(invalid)).toEqual({ ok: false, error: "kind" });
  });

  it("rejects fractional capacity and values above the approved maximum", () => {
    const invalid = validFormData();
    invalid.set("capacity", "1.5");
    expect(validateEventInput(invalid)).toEqual({ ok: false, error: "capacity" });
    invalid.set("capacity", "51");
    expect(validateEventInput(invalid)).toEqual({ ok: false, error: "capacity" });
  });

  it("rejects an end time that is not after the start", () => {
    const invalid = validFormData();
    invalid.set("endTime", "18:00");
    expect(validateEventInput(invalid)).toEqual({ ok: false, error: "endsAt" });
  });

  it("accepts free events and Arabic price digits", () => {
    expect(parsePriceSarToHalalas("٠")).toBe(0);
    expect(parsePriceSarToHalalas("١٢٫٥٠")).toBe(1250);
    expect(parsePriceSarToHalalas("١٢.٥٠")).toBe(1250);
    const freeEvent = validFormData();
    freeEvent.set("priceSar", "٠");
    expect(validateEventInput(freeEvent)).toMatchObject({
      ok: true,
      value: { priceHalalas: 0 },
    });
  });

  it("allows only the approved publication transitions", () => {
    expect(canChangeEventStatus("draft", "published")).toBe(true);
    expect(canChangeEventStatus("published", "draft")).toBe(false);
    expect(canChangeEventStatus("published", "archived")).toBe(true);
    expect(canChangeEventStatus("archived", "draft")).toBe(true);
  });
});
