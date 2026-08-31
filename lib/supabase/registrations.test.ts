import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseRegistrationRepository } from "@/lib/supabase/registrations";
import type { Database } from "@/lib/supabase/database.types";

interface RecordedCall {
  method: string;
  args: unknown[];
}

function chainable(result: unknown, calls: RecordedCall[]): PromiseLike<unknown> {
  const handler: Record<string, unknown> = {
    then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  for (const method of ["select", "order", "eq", "gte", "lt", "in", "ilike", "or", "range"]) {
    handler[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return handler;
    };
  }
  return handler as unknown as PromiseLike<unknown>;
}

function fakeClient() {
  const eventsCalls: RecordedCall[] = [];
  const registrationsCalls: RecordedCall[] = [];
  const eventsResult = { data: [{ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", title: "فعالية", starts_at: "2026-06-01T10:00:00.000Z" }], error: null };
  const registrationsResult = { data: [], error: null, count: 0 };

  const client = {
    from: (table: string) => {
      if (table === "events") return chainable(eventsResult, eventsCalls);
      if (table === "registrations") return chainable(registrationsResult, registrationsCalls);
      throw new Error(`unexpected table ${table}`);
    },
  } as unknown as SupabaseClient<Database>;

  return { client, eventsCalls, registrationsCalls };
}

describe("SupabaseRegistrationRepository.listPage — previous view lookback (admin overhaul plan A6)", () => {
  it("bounds the past-events lookup to a retention-safe window instead of fetching every past event ever", async () => {
    const now = "2026-08-26T00:00:00.000Z";
    const { client, eventsCalls } = fakeClient();
    const repository = new SupabaseRegistrationRepository(client);

    await repository.listPage({ view: "previous", query: "", page: 1, pageSize: 25, now });

    const gteCall = eventsCalls.find((call) => call.method === "gte");
    expect(gteCall).toBeDefined();
    const [column, value] = gteCall!.args as [string, string];
    expect(column).toBe("starts_at");

    // Registration rows are deleted 90 days after their event by a daily cron job, so no
    // "previous" event older than that can still have live registration data. The lookback
    // must stay bounded near that window, not grow unboundedly with the club's history.
    const lookbackDays = (new Date(now).getTime() - new Date(value).getTime()) / (24 * 60 * 60 * 1000);
    expect(lookbackDays).toBeCloseTo(100, 0);
  });

  it("does not apply a lookback bound for the upcoming view", async () => {
    const now = "2026-08-26T00:00:00.000Z";
    const { client, eventsCalls } = fakeClient();
    const repository = new SupabaseRegistrationRepository(client);

    await repository.listPage({ view: "upcoming", query: "", page: 1, pageSize: 25, now });

    const gteCalls = eventsCalls.filter((call) => call.method === "gte");
    expect(gteCalls.length).toBeGreaterThan(0);
    for (const call of gteCalls) expect(call.args).toEqual(["starts_at", now]);
  });
});

/** A `from("registrations")` chain that also records `limit` and resolves to a fixed result. */
function pulseClient(result: { data: unknown; error: unknown; count?: number | null }) {
  const calls: RecordedCall[] = [];
  const handler: Record<string, unknown> = {
    then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  for (const method of ["select", "order", "eq", "in", "limit"]) {
    handler[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return handler;
    };
  }
  const client = { from: () => handler } as unknown as SupabaseClient<Database>;
  return { client, calls };
}

describe("SupabaseRegistrationRepository.pulseLatest", () => {
  const row = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    attendee_name: "زياد",
    created_at: "2026-08-31T10:00:00.000Z",
    event_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    events: { title: "مساء بين" },
  };

  it("returns the newest held seat with its event title and the platform-wide count", async () => {
    const { client } = pulseClient({ data: [row], error: null, count: 12 });

    const outcome = await new SupabaseRegistrationRepository(client).pulseLatest();

    expect(outcome).toEqual({
      ok: true,
      data: {
        activeCount: 12,
        latestRegistrationId: row.id,
        attendeeName: "زياد",
        eventId: row.event_id,
        eventTitle: "مساء بين",
        timestamp: row.created_at,
      },
    });
  });

  it("counts only held seats, and fetches a single row — this runs on a 15-second poll", async () => {
    const { client, calls } = pulseClient({ data: [row], error: null, count: 12 });

    await new SupabaseRegistrationRepository(client).pulseLatest();

    expect(calls.find((call) => call.method === "in")!.args).toEqual(["status", ["registered", "invited"]]);
    expect(calls.find((call) => call.method === "limit")!.args).toEqual([1]);
    expect(calls.find((call) => call.method === "order")!.args).toEqual(["created_at", { ascending: false }]);
    const [columns] = calls.find((call) => call.method === "select")!.args as [string, unknown];
    // Nothing beyond a name and the event title: no phone, email, or guardian record on a poll.
    expect(columns).toBe("id,attendee_name,created_at,event_id,events(title)");
  });

  it("reports an empty platform rather than inventing a registration", async () => {
    const { client } = pulseClient({ data: [], error: null, count: 0 });

    const outcome = await new SupabaseRegistrationRepository(client).pulseLatest();

    expect(outcome).toEqual({
      ok: true,
      data: { activeCount: 0, latestRegistrationId: null, attendeeName: null, eventId: null, eventTitle: null, timestamp: null },
    });
  });

  it("fails the read rather than reporting zero registrations when the query errors", async () => {
    const { client } = pulseClient({ data: null, error: { message: "boom" }, count: null });

    const outcome = await new SupabaseRegistrationRepository(client).pulseLatest();

    expect(outcome.ok).toBe(false);
  });
});
