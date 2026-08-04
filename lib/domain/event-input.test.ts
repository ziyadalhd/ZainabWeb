import { describe, expect, it } from "vitest";
import { canChangeEventStatus, riyadhDateTimeLocalToIso, validateEventInput } from "@/lib/domain/event-input";

function validFormData() {
  const formData = new FormData();
  formData.set("title", "  لقاء القراءة  ");
  formData.set("audience", "adults");
  formData.set("eventTypeLabel", " لقاء ");
  formData.set("startsAt", "2026-08-10T18:00");
  formData.set("capacity", "20");
  formData.set("availability", "available");
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
      value: { title: "لقاء القراءة", audience: "adults", eventTypeLabel: "لقاء", startsAt: "2026-08-10T15:00:00.000Z", capacity: 20, availability: "available" },
    });
    const invalid = validFormData();
    invalid.set("audience", "all");
    expect(validateEventInput(invalid)).toEqual({ ok: false, error: "audience" });
  });

  it("rejects non-positive or fractional capacity", () => {
    const invalid = validFormData();
    invalid.set("capacity", "1.5");
    expect(validateEventInput(invalid)).toEqual({ ok: false, error: "capacity" });
  });

  it("allows only the approved publication transitions", () => {
    expect(canChangeEventStatus("draft", "published")).toBe(true);
    expect(canChangeEventStatus("published", "draft")).toBe(false);
    expect(canChangeEventStatus("published", "archived")).toBe(true);
    expect(canChangeEventStatus("archived", "draft")).toBe(true);
  });
});
