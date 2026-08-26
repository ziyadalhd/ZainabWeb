import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapEventRow, SupabaseEventRepository } from "@/lib/supabase/events";
import type { Database } from "@/lib/supabase/database.types";

const row = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  title: "لقاء",
  event_kind: "club_event",
  audience: "adults",
  event_type_label: "قراءة",
  poster_path: null,
  starts_at: "2026-08-10T15:00:00.000Z",
  ends_at: "2026-08-10T17:00:00.000Z",
  capacity: 20,
  price_halalas: 7500,
  registration_status: "open",
  publication_status: "draft",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

const state = {
  event_id: row.id,
  active_reservation_count: 4,
  registration_availability: "available",
};

describe("mapEventRow", () => {
  it("keeps Supabase types inside the adapter", () => {
    expect(mapEventRow(row, state)).toEqual({
      id: row.id,
      title: "لقاء",
      kind: "club_event",
      audience: "adults",
      eventTypeLabel: "قراءة",
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      capacity: 20,
      activeReservationCount: 4,
      priceHalalas: 7500,
      posterUrl: null,
      registrationStatus: "open",
      availability: "available",
      publicationStatus: "draft",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  });

  it("rejects unexpected constrained values", () => {
    expect(() => mapEventRow({ ...row, publication_status: "deleted" }, state)).toThrow();
    expect(() => mapEventRow({ ...row, event_kind: "unknown" }, state)).toThrow();
  });
});

function chainable(result: { data: unknown; error: unknown }): PromiseLike<{ data: unknown; error: unknown }> {
  const handler: Record<string, unknown> = {
    then: (onFulfilled: (value: { data: unknown; error: unknown }) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  for (const method of ["select", "order", "eq", "gte", "lt", "in", "ilike", "or", "range", "not"]) {
    handler[method] = () => handler;
  }
  return handler as unknown as PromiseLike<{ data: unknown; error: unknown }>;
}

function fakeEventsClient(eventsResult: { data: unknown; error: unknown }, statesResult: { data: unknown; error: unknown }): SupabaseClient<Database> {
  return {
    from: () => chainable(eventsResult),
    rpc: () => Promise.resolve(statesResult),
  } as unknown as SupabaseClient<Database>;
}

describe("SupabaseEventRepository.list", () => {
  it("returns a load-failed result instead of an empty array when the events query errors (admin overhaul plan A2)", async () => {
    const repository = new SupabaseEventRepository(fakeEventsClient(
      { data: null, error: { code: "PGRST116" } },
      { data: [], error: null },
    ));

    await expect(repository.list()).resolves.toEqual({ ok: false, code: "load_failed" });
  });

  it("returns the mapped events wrapped in a successful result", async () => {
    const repository = new SupabaseEventRepository(fakeEventsClient(
      { data: [row], error: null },
      { data: [state], error: null },
    ));

    const result = await repository.list();

    expect(result.ok).toBe(true);
    expect(result.ok && result.data).toEqual([mapEventRow(row, state)]);
  });
});
