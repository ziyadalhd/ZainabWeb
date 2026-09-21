import { messageTemplateKinds, type MessageTemplateKind } from "@/lib/messaging/message-templates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type MessageTemplateBodies = Partial<Record<MessageTemplateKind, string>>;

/** Resolves one kind, preferring an event override over the global default. */
export async function getMessageTemplate(kind: MessageTemplateKind, eventId: string | null = null): Promise<string | null> {
  const client = await createSupabaseServerClient();
  if (eventId) {
    const { data } = await client.from("message_templates").select("body").eq("kind", kind).eq("event_id", eventId).maybeSingle();
    if (data) return data.body;
  }
  const { data } = await client.from("message_templates").select("body").eq("kind", kind).is("event_id", null).maybeSingle();
  return data?.body ?? null;
}

/** Reads every stored body for one scope in a single query. */
export async function listMessageTemplates(eventId: string | null = null): Promise<MessageTemplateBodies> {
  const client = await createSupabaseServerClient();
  let query = client.from("message_templates").select("kind, body");
  query = eventId ? query.eq("event_id", eventId) : query.is("event_id", null);
  const { data } = await query;
  const bodies: MessageTemplateBodies = {};
  for (const row of data ?? []) {
    if (messageTemplateKinds.includes(row.kind as MessageTemplateKind)) {
      bodies[row.kind as MessageTemplateKind] = row.body;
    }
  }
  return bodies;
}

export async function saveMessageTemplate(kind: MessageTemplateKind, body: string, eventId: string | null = null): Promise<void> {
  const client = await createSupabaseServerClient();
  let query = client.from("message_templates").select("id").eq("kind", kind);
  query = eventId ? query.eq("event_id", eventId) : query.is("event_id", null);
  const { data: existing, error: lookupError } = await query.maybeSingle();
  if (lookupError) throw new Error("template_save_failed");
  const { error } = existing
    ? await client.from("message_templates").update({ body }).eq("id", existing.id)
    : await client.from("message_templates").insert({ kind, body, event_id: eventId });
  if (error) throw new Error("template_save_failed");
}

/** Drops an event override so the message falls back to the global default. */
export async function deleteEventMessageTemplate(kind: MessageTemplateKind, eventId: string): Promise<void> {
  const client = await createSupabaseServerClient();
  const { error } = await client.from("message_templates").delete().eq("kind", kind).eq("event_id", eventId);
  if (error) throw new Error("template_delete_failed");
}

