import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminPulse } from "@/lib/domain/types";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), pulseLatest: vi.fn() }));

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/registrations", () => ({
  createAdminRegistrationRepository: vi.fn(async () => ({ pulseLatest: mocks.pulseLatest })),
}));

import { GET } from "@/app/(dashboard)/admin/(protected)/pulse/route";

const pulse: AdminPulse = {
  activeCount: 12,
  latestRegistrationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  attendeeName: "زياد",
  eventId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  eventTitle: "مساء بين",
  timestamp: "2026-08-31T10:00:00.000Z",
};

describe("GET /admin/pulse", () => {
  beforeEach(() => {
    mocks.requireAdmin.mockReset();
    mocks.pulseLatest.mockReset();
  });

  it("returns the latest registration across all events", async () => {
    mocks.pulseLatest.mockResolvedValue({ ok: true, data: pulse });

    const response = await GET();

    expect(mocks.requireAdmin).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual(pulse);
  });

  it("carries no contact details — only a name and an event title", async () => {
    mocks.pulseLatest.mockResolvedValue({ ok: true, data: pulse });

    const body = (await (await GET()).json()) as Record<string, unknown>;

    expect(Object.keys(body).sort()).toEqual(
      ["activeCount", "attendeeName", "eventId", "eventTitle", "latestRegistrationId", "timestamp"].sort(),
    );
  });

  it("reports the read failure rather than an empty pulse the client would read as 'no registrations'", async () => {
    mocks.pulseLatest.mockResolvedValue({ ok: false });

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: "unavailable" });
  });

  it("refuses before touching the database when the admin guard rejects", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(GET()).rejects.toThrow();
    expect(mocks.pulseLatest).not.toHaveBeenCalled();
  });
});
