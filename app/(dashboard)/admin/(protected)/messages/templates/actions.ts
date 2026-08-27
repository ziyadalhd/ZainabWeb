"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isEntityId } from "@/lib/domain/entity-id";
import { registrationReminderTemplateTokens } from "@/lib/messaging/registration-reminder";
import { saveRegistrationReminderTemplate } from "@/lib/supabase/message-templates";
import type { ActionResult } from "@/lib/data/action-result";

export async function saveGlobalReminderTemplateAction(formData: FormData) {
  await requireAdmin();
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 1 || body.length > 2000 || registrationReminderTemplateTokens.some((token) => !body.includes(token))) {
    redirect("/admin/settings?tab=templates&error=validation");
  }
  try {
    await saveRegistrationReminderTemplate(body);
  } catch {
    redirect("/admin/settings?tab=templates&error=save");
  }
  revalidatePath("/admin/settings");
  redirect("/admin/settings?tab=templates&success=saved");
}

const eventTemplateErrorMessage = "تحققي من النص والمتغيرات المطلوبة.";

export async function saveEventReminderTemplateAction(
  eventId: string,
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  void _previousState;
  await requireAdmin();
  const body = String(formData.get("body") ?? "").trim();
  if (!isEntityId(eventId) || body.length < 1 || body.length > 2000 || registrationReminderTemplateTokens.some((token) => !body.includes(token))) {
    return { status: "error", message: eventTemplateErrorMessage };
  }
  try {
    await saveRegistrationReminderTemplate(body, eventId);
  } catch {
    return { status: "error", message: eventTemplateErrorMessage };
  }
  revalidatePath("/admin/events");
  return { status: "success" };
}
