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

interface DeleteFixture {
  /** `events` row read for its poster path; null means the event does not exist. */
  event?: { data: unknown; error?: unknown };
  registrationCount?: { count: number | null; error?: unknown };
  feedbackCount?: { count: number | null; error?: unknown };
  /** Result of the delete itself. An empty `data` stands for a row RLS filtered away. */
  deleted?: { data: unknown; error?: unknown };
}

/**
 * A per-table stub for the delete path. `select(...)` and `delete(...)` set the mode, `eq` chains,
 * `maybeSingle()` resolves a single row, and awaiting the builder directly resolves the head/count
 * query — which is the shape `delete()` actually calls.
 */
function fakeDeleteClient(fixture: DeleteFixture): SupabaseClient<Database> {
  return {
    from: (table: string) => {
      let deleting = false;
      const builder: Record<string, unknown> = {
        select: () => builder,
        delete: () => {
          deleting = true;
          return builder;
        },
        eq: () => builder,
        maybeSingle: () =>
          Promise.resolve(deleting ? (fixture.deleted ?? { data: { id: "x" }, error: null }) : (fixture.event ?? { data: null, error: null })),
        then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) => {
          const counts = table === "registrations" ? fixture.registrationCount : fixture.feedbackCount;
          return Promise.resolve({ count: counts?.count ?? 0, error: counts?.error ?? null }).then(onFulfilled, onRejected);
        },
      };
      return builder;
    },
  } as unknown as SupabaseClient<Database>;
}

describe("SupabaseEventRepository.delete", () => {
  it("reports not-found for an event that does not exist", async () => {
    const repository = new SupabaseEventRepository(fakeDeleteClient({ event: { data: null, error: null } }));

    await expect(repository.delete(row.id)).resolves.toEqual({ deleted: false, reason: "not-found" });
  });

  it("refuses to delete an event that has registrations", async () => {
    const repository = new SupabaseEventRepository(
      fakeDeleteClient({ event: { data: { poster_path: null }, error: null }, registrationCount: { count: 3 } }),
    );

    await expect(repository.delete(row.id)).resolves.toEqual({ deleted: false, reason: "has-attendees" });
  });

  it("refuses to delete an event that collected feedback even with no registrations", async () => {
    const repository = new SupabaseEventRepository(
      fakeDeleteClient({ event: { data: { poster_path: null }, error: null }, registrationCount: { count: 0 }, feedbackCount: { count: 1 } }),
    );

    await expect(repository.delete(row.id)).resolves.toEqual({ deleted: false, reason: "has-attendees" });
  });

  it("maps a foreign-key violation from a race to the same has-attendees refusal", async () => {
    const repository = new SupabaseEventRepository(
      fakeDeleteClient({ event: { data: { poster_path: null }, error: null }, deleted: { data: null, error: { code: "23503" } } }),
    );

    await expect(repository.delete(row.id)).resolves.toEqual({ deleted: false, reason: "has-attendees" });
  });

  it("treats a delete that RLS filtered to zero rows as not-found rather than success", async () => {
    const repository = new SupabaseEventRepository(
      fakeDeleteClient({ event: { data: { poster_path: null }, error: null }, deleted: { data: null, error: null } }),
    );

    await expect(repository.delete(row.id)).resolves.toEqual({ deleted: false, reason: "not-found" });
  });

  it("returns the poster path so the caller can clean up storage", async () => {
    const repository = new SupabaseEventRepository(
      fakeDeleteClient({ event: { data: { poster_path: "events/poster.png" }, error: null }, deleted: { data: { id: row.id }, error: null } }),
    );

    await expect(repository.delete(row.id)).resolves.toEqual({ deleted: true, posterPath: "events/poster.png" });
  });
});
