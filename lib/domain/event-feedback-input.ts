import type { EventFeedbackInput, Rating } from "@/lib/domain/types";

const ratings = new Set<Rating>([1, 2, 3, 4, 5]);

export type EventFeedbackInputError = "hospitalityRating" | "materialRating" | "identityVisible" | "suggestions";

export type EventFeedbackInputResult =
  | { ok: true; value: EventFeedbackInput }
  | { ok: false; error: EventFeedbackInputError };

function getRating(value: FormDataEntryValue | null): Rating | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && ratings.has(parsed as Rating) ? parsed as Rating : null;
}

export function validateEventFeedbackInput(formData: FormData): EventFeedbackInputResult {
  const hospitalityRating = getRating(formData.get("hospitalityRating"));
  if (hospitalityRating === null) return { ok: false, error: "hospitalityRating" };

  const materialRating = getRating(formData.get("materialRating"));
  if (materialRating === null) return { ok: false, error: "materialRating" };

  const identityVisibleValue = formData.get("identityVisible");
  if (identityVisibleValue !== "true" && identityVisibleValue !== "false") {
    return { ok: false, error: "identityVisible" };
  }

  const suggestions = String(formData.get("suggestions") ?? "").trim();
  if (suggestions.length > 4000) return { ok: false, error: "suggestions" };

  return {
    ok: true,
    value: {
      hospitalityRating,
      materialRating,
      suggestions: suggestions || null,
      identityVisible: identityVisibleValue === "true",
    },
  };
}
