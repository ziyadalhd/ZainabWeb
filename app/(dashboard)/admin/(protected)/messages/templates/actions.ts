"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isEntityId } from "@/lib/domain/entity-id";
import {
  findMissingTokens,
  isMessageTemplateKind,
  messageTemplateTokenLabels,
} from "@/lib/messaging/message-templates";
import {
  deleteEventMessageTemplate,
  saveMessageTemplate,
} from "@/lib/supabase/message-templates";
import type { ActionResult } from "@/lib/data/action-result";

const maxTemplateLength = 2000;

/** Names the missing variables in Arabic so the admin knows what to put back. */
function describeMissingTokens(kind: string, body: string): string | null {
  if (!isMessageTemplateKind(kind)) return "نوع الرسالة غير معروف.";
  if (body.length < 1) return "اكتبي نص الرسالة.";
  if (body.length > maxTemplateLength) return `النص أطول من ${maxTemplateLength} حرف. اختصريه قليلًا.`;

  const missing = findMissingTokens(kind, body);
  if (missing.length === 0) return null;
  const names = missing.map((token) => `«${messageTemplateTokenLabels[token]}»`).join("، ");
  return `الرسالة ناقصها ${names}. أضيفيها من الأزرار فوق مربع النص.`;
}

export async function saveMessageTemplateAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  void _previousState;
  await requireAdmin();

  const kind = String(formData.get("kind") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const eventId = String(formData.get("eventId") ?? "").trim() || null;

  const problem = describeMissingTokens(kind, body);
  if (problem) return { status: "error", message: problem };
  if (!isMessageTemplateKind(kind)) return { status: "error", message: "نوع الرسالة غير معروف." };
  if (eventId && !isEntityId(eventId)) return { status: "error", message: "الفعالية غير معروفة." };

  try {
    await saveMessageTemplate(kind, body, eventId);
  } catch {
    return { status: "error", message: "تعذر الحفظ. حاولي مرة أخرى بعد لحظة." };
  }

  revalidatePath("/admin/settings");
  if (eventId) revalidatePath("/admin/events");
  return { status: "success" };
}

/** Removes an event override so the event falls back to the global text. */
export async function resetEventMessageTemplateAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  void _previousState;
  await requireAdmin();

  const kind = String(formData.get("kind") ?? "");
  const eventId = String(formData.get("eventId") ?? "").trim();
  if (!isMessageTemplateKind(kind)) return { status: "error", message: "نوع الرسالة غير معروف." };
  if (!isEntityId(eventId)) return { status: "error", message: "الفعالية غير معروفة." };

  try {
    await deleteEventMessageTemplate(kind, eventId);
  } catch {
    return { status: "error", message: "تعذر الاستعادة. حاولي مرة أخرى بعد لحظة." };
  }

  revalidatePath("/admin/events");
  return { status: "success" };
}
