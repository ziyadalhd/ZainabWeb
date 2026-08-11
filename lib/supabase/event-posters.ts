import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export class SupabaseEventPosterStorage {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async upload(eventId: string, file: File, extension: "png" | "jpg" | "webp"): Promise<string> {
    const path = `${eventId}/${crypto.randomUUID()}.${extension}`;
    const contentType = file.type;
    const body = new Uint8Array(await file.arrayBuffer());
    const { error } = await this.client.storage.from("event-posters").upload(path, body, {
      contentType,
      upsert: false,
    });
    if (error) throw new Error("تعذر رفع بوستر الفعالية.");
    return path;
  }

  async remove(path: string): Promise<void> {
    const { error } = await this.client.storage.from("event-posters").remove([path]);
    if (error) throw new Error("تعذر إزالة بوستر الفعالية السابق.");
  }
}
