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
