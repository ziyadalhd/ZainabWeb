"use server";

import { redirect } from "next/navigation";
import { validateInterestedContactInput } from "@/lib/domain/interested-contact-input";
import { createInterestedContactService, InterestedContactFailure } from "@/lib/supabase/interested-contacts";
import { verifyTurnstile } from "@/lib/security/turnstile";

export async function submitInterestedContactAction(formData: FormData): Promise<void> {
  const turnstile = await verifyTurnstile(formData);
  if (!turnstile.ok) redirect("/surveys/interested-contact?error=turnstile");

  const input = validateInterestedContactInput(formData);
  if (!input.ok) redirect(`/surveys/interested-contact?error=${input.error}`);

  try {
    const service = await createInterestedContactService();
    const receipt = await service.submit(input.value);
    redirect(`/surveys/interested-contact/confirmed/${receipt.unsubscribeToken}`);
  } catch (error) {
    const code = error instanceof InterestedContactFailure ? error.code : "save";
    redirect(`/surveys/interested-contact?error=${code === "invalid" ? "invalid" : "save"}`);
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
