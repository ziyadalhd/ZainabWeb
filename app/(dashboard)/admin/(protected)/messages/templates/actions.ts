"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isEntityId } from "@/lib/domain/entity-id";
import { registrationReminderTemplateTokens } from "@/lib/messaging/registration-reminder";
import { saveRegistrationReminderTemplate } from "@/lib/supabase/message-templates";

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

export async function saveEventReminderTemplateAction(eventId: string, formData: FormData) {
  await requireAdmin();
  const body = String(formData.get("body") ?? "").trim();
  if (!isEntityId(eventId) || body.length < 1 || body.length > 2000 || registrationReminderTemplateTokens.some((token) => !body.includes(token)))
    redirect(`/admin/events/${eventId}?tab=communications&error=template`);
  try {
    await saveRegistrationReminderTemplate(body, eventId);
  } catch {
    redirect(`/admin/events/${eventId}?tab=communications&error=template`);
  }
  revalidatePath(`/admin/events/${eventId}`);
  redirect(`/admin/events/${eventId}?tab=communications&success=template`);
}
