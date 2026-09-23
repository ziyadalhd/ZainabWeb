import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SupabaseSiteSettingsRepository } from "@/lib/supabase/site-settings";

function fakeClient(result: { data: unknown; error: unknown }): SupabaseClient<Database> {
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: () => Promise.resolve(result),
  };
  return { from: () => query } as unknown as SupabaseClient<Database>;
}

describe("SupabaseSiteSettingsRepository.get", () => {
  // The admin content form is filled from this result, so placeholder text here would be saved
  // over the club's real content.
  it("fails loudly when the query errors, instead of returning placeholder content", async () => {
    const repository = new SupabaseSiteSettingsRepository(fakeClient({ data: null, error: { code: "PGRST000" } }));

    await expect(repository.get()).rejects.toThrow();
  });

  it("fails loudly when the settings row is missing", async () => {
    const repository = new SupabaseSiteSettingsRepository(fakeClient({ data: null, error: null }));

    await expect(repository.get()).rejects.toThrow();
  });
});
