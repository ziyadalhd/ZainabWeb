import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseInterestedContactRepository } from "@/lib/supabase/interested-contacts";
import type { Database } from "@/lib/supabase/database.types";

function chainable(result: { data: unknown; error: unknown }): PromiseLike<{ data: unknown; error: unknown }> {
  const handler: Record<string, unknown> = {
    then: (onFulfilled: (value: { data: unknown; error: unknown }) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  for (const method of ["select", "order"]) {
    handler[method] = () => handler;
  }
  return handler as unknown as PromiseLike<{ data: unknown; error: unknown }>;
}

function fakeClient(result: { data: unknown; error: unknown }): SupabaseClient<Database> {
  return { from: () => chainable(result) } as unknown as SupabaseClient<Database>;
}

const row = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  contact_name: "مهتمة",
  phone_e164: "+966500000001",
  email: "contact@example.test",
  consented_at: "2026-08-01T00:00:00.000Z",
  unsubscribed_at: null,
  created_at: "2026-08-01T00:00:00.000Z",
};

describe("SupabaseInterestedContactRepository.list", () => {
  it("returns a load-failed result instead of an empty array when the query errors (admin overhaul plan A2)", async () => {
    const repository = new SupabaseInterestedContactRepository(fakeClient({ data: null, error: { code: "PGRST116" } }));

    await expect(repository.list()).resolves.toEqual({ ok: false, code: "load_failed" });
  });

  it("returns the mapped contacts wrapped in a successful result", async () => {
    const repository = new SupabaseInterestedContactRepository(fakeClient({ data: [row], error: null }));

    const result = await repository.list();

    expect(result.ok).toBe(true);
    expect(result.ok && result.data).toEqual([{
      id: row.id,
      contactName: row.contact_name,
      phoneE164: row.phone_e164,
      email: row.email,
      consentedAt: row.consented_at,
      unsubscribedAt: row.unsubscribed_at,
      createdAt: row.created_at,
    }]);
  });
});
