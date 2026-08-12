"use server";

import { redirect } from "next/navigation";
import { validateEventFeedbackInput } from "@/lib/domain/event-feedback-input";
import { createEventFeedbackService } from "@/lib/supabase/event-feedback";
import { verifyTurnstile } from "@/lib/security/turnstile";

export type SubmitEventFeedbackActionState = {
  error?: "hospitalityRating" | "materialRating" | "identityVisible" | "suggestions" | "turnstile" | "save";
};

export async function submitEventFeedbackAction(
  token: string,
  _previousState: SubmitEventFeedbackActionState,
  formData: FormData,
): Promise<SubmitEventFeedbackActionState> {
  void _previousState;
  const turnstile = await verifyTurnstile(formData);
  if (!turnstile.ok) return { error: "turnstile" };

  const input = validateEventFeedbackInput(formData);
  if (!input.ok) return { error: input.error };

  try {
    const service = await createEventFeedbackService();
    await service.submitByToken(token, input.value);
  } catch {
    return { error: "save" };
  }
  redirect("/surveys/event-feedback/sent");
}
