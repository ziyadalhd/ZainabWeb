import { describe, expect, it } from "vitest";
import { validateEventFeedbackInput } from "@/lib/domain/event-feedback-input";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("validateEventFeedbackInput", () => {
  it("accepts only the approved feedback fields", () => {
    expect(validateEventFeedbackInput(form({
      hospitalityRating: "5",
      materialRating: "4",
      suggestions: "مقترح مفيد",
      identityVisible: "false",
    }))).toEqual({
      ok: true,
      value: { hospitalityRating: 5, materialRating: 4, suggestions: "مقترح مفيد", identityVisible: false },
    });
  });

  it("requires both ratings and an explicit identity choice", () => {
    expect(validateEventFeedbackInput(form({ materialRating: "4", identityVisible: "true" }))).toEqual({ ok: false, error: "hospitalityRating" });
    expect(validateEventFeedbackInput(form({ hospitalityRating: "5", materialRating: "4" }))).toEqual({ ok: false, error: "identityVisible" });
  });
});
