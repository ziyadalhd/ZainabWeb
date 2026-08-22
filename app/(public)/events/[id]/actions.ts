"use server";

import { revalidatePath } from "next/cache";
import type { EventAudience, RegistrationStatus } from "@/lib/domain/types";
import { validateRegistrationInput } from "@/lib/domain/registration-input";
import { createEventCatalog } from "@/lib/supabase/events";
import {
  createRegistrationService,
  RegistrationFailure,
} from "@/lib/supabase/registrations";
import { verifyTurnstile } from "@/lib/security/turnstile";

export type RegistrationActionError =
  | "attendeeName"
  | "phone"
  | "email"
  | "participantAge"
  | "guardianName"
  | "guardianConsent"
  | "duplicate"
  | "unavailable"
  | "turnstile"
  | "save";

export interface RegistrationActionState {
  error?: RegistrationActionError;
  reference?: string;
  status?: RegistrationStatus;
  managementPath?: string;
}

export async function registerForEventAction(
  eventId: string,
  audience: EventAudience,
  _previousState: RegistrationActionState,
  formData: FormData,
): Promise<RegistrationActionState> {
  const turnstile = await verifyTurnstile(formData);
  if (!turnstile.ok) return { error: "turnstile" };

  const catalog = await createEventCatalog();
  const event = await catalog.getUpcomingEvent(eventId);
  if (
    !event
    || event.audience !== audience
    || event.endsAt === null
    || event.priceHalalas === null
    || event.availability === "closed"
  ) {
    return { error: "unavailable" };
  }

  const input = validateRegistrationInput(formData, audience);
  if (!input.ok) {
    return { error: input.error === "invalid" ? "save" : input.error };
  }

  try {
    const service = await createRegistrationService();
    const receipt = await service.register(eventId, input.value);
    revalidatePath("/admin");
    revalidatePath("/admin/registrations/current");
    revalidatePath("/admin/registrations");
    revalidatePath("/admin/waitlist");
    return {
      reference: receipt.reference,
      status: receipt.status,
      managementPath: `/bookings/${receipt.managementToken}`,
    };
  } catch (error) {
    if (error instanceof RegistrationFailure) {
      if (error.code === "duplicate") return { error: "duplicate" };
      if (error.code === "unavailable") return { error: "unavailable" };
    }
    return { error: "save" };
  }
}
