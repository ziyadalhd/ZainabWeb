"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isEntityId } from "@/lib/domain/entity-id";
import type { ManualMessageKind } from "@/lib/domain/types";
import { isManualMessageKind } from "@/lib/messaging/manual-messages";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";

export interface OpenManualMessageResult {
  messageId?: string;
  kind?: ManualMessageKind;
  securePath?: string | null;
  error?: "invalid" | "prepare";
}

export interface MarkManualMessageSentResult {
  sentAt?: string;
  error?: "invalid" | "save";
}

export interface SendManualMessageResult {
  messageId?: string;
  kind?: ManualMessageKind;
  securePath?: string | null;
  sentAt?: string;
  error?: "invalid" | "prepare" | "save";
}

function refreshEventCommunications(eventId: string) {
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin");
}

export async function openManualWhatsAppMessageAction(eventId: string, registrationId: string, kind: string): Promise<OpenManualMessageResult> {
  await requireAdmin();
  if (!isEntityId(eventId) || !isEntityId(registrationId) || !isManualMessageKind(kind)) {
    return { error: "invalid" };
  }

  try {
    const repository = await createAdminRegistrationRepository();
    const message = await repository.prepareManualMessage(registrationId, kind);
    refreshEventCommunications(eventId);
    return {
      messageId: message.id,
      kind: message.kind,
      securePath: message.securePath,
    };
  } catch {
    return { error: "prepare" };
  }
}

export async function markManualMessageSentAction(eventId: string, messageId: string): Promise<MarkManualMessageSentResult> {
  await requireAdmin();
  if (!isEntityId(eventId) || !isEntityId(messageId)) return { error: "invalid" };

  try {
    const repository = await createAdminRegistrationRepository();
    const sentAt = await repository.markManualMessageSent(messageId);
    refreshEventCommunications(eventId);
    return { sentAt };
  } catch {
    return { error: "save" };
  }
}

/**
 * Prepares a manual WhatsApp message and records it as sent, in one round trip.
 *
 * This replaces the three-step handoff (prepare link, open WhatsApp, come back and confirm). The
 * admin's click is still the explicit act that marks the message sent — `AGENTS.md` §270 requires
 * an administrator to mark it rather than the system to infer delivery, and that holds; what is
 * gone is the second trip back to the dashboard to press a button that only ever confirmed what the
 * first click already decided. The wording stays "recorded as sent", never "delivered".
 *
 * A failed mark still returns the prepared link, so the message the admin is about to send in the
 * open WhatsApp tab is the correct one and only the bookkeeping needs retrying.
 */
export async function sendManualWhatsAppMessageAction(eventId: string, registrationId: string, kind: string): Promise<SendManualMessageResult> {
  await requireAdmin();
  if (!isEntityId(eventId) || !isEntityId(registrationId) || !isManualMessageKind(kind)) return { error: "invalid" };

  let message: Awaited<ReturnType<Awaited<ReturnType<typeof createAdminRegistrationRepository>>["prepareManualMessage"]>>;
  const repository = await createAdminRegistrationRepository();
  try {
    message = await repository.prepareManualMessage(registrationId, kind);
  } catch {
    return { error: "prepare" };
  }

  const prepared = { messageId: message.id, kind: message.kind, securePath: message.securePath };
  try {
    const sentAt = await repository.markManualMessageSent(message.id);
    refreshEventCommunications(eventId);
    return { ...prepared, sentAt };
  } catch {
    refreshEventCommunications(eventId);
    return { ...prepared, error: "save" };
  }
}
