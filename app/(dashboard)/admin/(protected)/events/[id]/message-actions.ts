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
