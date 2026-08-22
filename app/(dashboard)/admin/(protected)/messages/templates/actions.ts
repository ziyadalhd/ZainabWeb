"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { registrationReminderTemplateTokens } from "@/lib/messaging/registration-reminder";
import { saveRegistrationReminderTemplate } from "@/lib/supabase/message-templates";

export async function saveGlobalReminderTemplateAction(formData: FormData) {
  await requireAdmin();
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 1 || body.length > 2000 || registrationReminderTemplateTokens.some((token) => !body.includes(token))) {
    redirect("/admin/messages/templates?error=validation");
  }
  try {
    await saveRegistrationReminderTemplate(body);
  } catch {
    redirect("/admin/messages/templates?error=save");
  }
  revalidatePath("/admin/messages");
  revalidatePath("/admin/messages/templates");
  redirect("/admin/messages/templates?success=saved");
}

export async function saveEventReminderTemplateAction(eventId: string, formData: FormData) {
  await requireAdmin();
  const body = String(formData.get("body") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(eventId) || body.length < 1 || body.length > 2000 || registrationReminderTemplateTokens.some((token) => !body.includes(token))) redirect(`/admin/events/${eventId}?tab=communications&error=template`);
  try { await saveRegistrationReminderTemplate(body, eventId); } catch { redirect(`/admin/events/${eventId}?tab=communications&error=template`); }
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin/messages");
  redirect(`/admin/events/${eventId}?tab=communications&success=template`);
}
