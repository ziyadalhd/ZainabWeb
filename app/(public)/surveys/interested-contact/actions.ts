"use server";

import { redirect } from "next/navigation";
import { validateInterestedContactInput } from "@/lib/domain/interested-contact-input";
import { createInterestedContactService, InterestedContactFailure } from "@/lib/supabase/interested-contacts";
import { verifyTurnstile } from "@/lib/security/turnstile";

export type InterestedContactActionError = "contactName" | "phone" | "email" | "consent" | "turnstile" | "invalid" | "save";

export type InterestedContactActionState = {
  error?: InterestedContactActionError;
  unsubscribePath?: string;
  saved?: true;
};

export async function submitInterestedContactAction(
  _previousState: InterestedContactActionState,
  formData: FormData,
): Promise<InterestedContactActionState> {
  const turnstile = await verifyTurnstile(formData);
  if (!turnstile.ok) return { error: "turnstile" };

  const input = validateInterestedContactInput(formData);
  if (!input.ok) return { error: input.error };

  try {
    const service = await createInterestedContactService();
    const receipt = await service.submit(input.value);
    return {
      saved: true,
      unsubscribePath: `/surveys/interested-contact/unsubscribe/${receipt.unsubscribeToken}`,
    };
  } catch (error) {
    const code = error instanceof InterestedContactFailure ? error.code : "save";
    return { error: code === "invalid" ? "invalid" : "save" };
  }
}

export async function unsubscribeInterestedContactAction(token: string): Promise<void> {
  try {
    const service = await createInterestedContactService();
    await service.unsubscribe(token);
    redirect(`/surveys/interested-contact/unsubscribe/${token}?success=true`);
  } catch {
    redirect(`/surveys/interested-contact/unsubscribe/${token}?error=true`);
  }
}
