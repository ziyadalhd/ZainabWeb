import { createSupabaseServerClient } from "@/lib/supabase/server";

export const registrationReminderTemplateKind = "registration_reminder" as const;

export async function getRegistrationReminderTemplate(eventId: string | null = null): Promise<string | null> {
  const client = await createSupabaseServerClient();
  if (eventId) {
    const { data } = await client.from("message_templates").select("body").eq("kind", registrationReminderTemplateKind).eq("event_id", eventId).maybeSingle();
    if (data) return data.body;
  }
  const { data } = await client.from("message_templates").select("body").eq("kind", registrationReminderTemplateKind).is("event_id", null).maybeSingle();
  return data?.body ?? null;
}

export async function getEventRegistrationReminderTemplate(eventId: string): Promise<string | null> {
  const client = await createSupabaseServerClient();
  const { data } = await client.from("message_templates").select("body").eq("kind", registrationReminderTemplateKind).eq("event_id", eventId).maybeSingle();
  return data?.body ?? null;
}

export async function saveRegistrationReminderTemplate(body: string, eventId: string | null = null): Promise<void> {
  const client = await createSupabaseServerClient();
  let query = client.from("message_templates").select("id").eq("kind", registrationReminderTemplateKind);
  query = eventId ? query.eq("event_id", eventId) : query.is("event_id", null);
  const { data: existing, error: lookupError } = await query.maybeSingle();
  if (lookupError) throw new Error("template_save_failed");
  const { error } = existing
    ? await client.from("message_templates").update({ body }).eq("id", existing.id)
    : await client.from("message_templates").insert({ kind: registrationReminderTemplateKind, body, event_id: eventId });
  if (error) throw new Error("template_save_failed");
}
