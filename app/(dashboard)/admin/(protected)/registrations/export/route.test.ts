import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { Registration } from "@/lib/domain/types";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/registrations", () => ({
  createAdminRegistrationRepository: vi.fn(async () => ({ list: mocks.list })),
}));

import { GET } from "@/app/(dashboard)/admin/(protected)/registrations/export/route";

const registration: Registration = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  reference: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  eventId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  eventTitle: "لقاء القراءة",
  eventStartsAt: "2099-08-12T15:00:00.000Z",
  attendeeName: "مشاركة",
  phoneE164: "+966500000001",
  email: null,
  participantAge: null,
  guardianName: null,
  guardianConsent: false,
  priceHalalasAtBooking: 0,
  status: "registered",
  attendanceStatus: "pending",
  checkInStatus: "pending",
  checkedInAt: null,
  paymentStatus: "unpaid",
  invitationExpiresAt: null,
  latestReminderPreparedAt: null,
  latestReminderSentAt: null,
  createdAt: "2026-08-09T15:00:00.000Z",
};

describe("registration export route", () => {
  beforeEach(() => {
    mocks.list.mockReset();
    mocks.requireAdmin.mockReset();
    mocks.requireAdmin.mockResolvedValue({ id: "admin" });
    mocks.list.mockResolvedValue([registration]);
  });

  it("requires an administrator before reading registration data", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new Error("unauthorized"));

    await expect(GET(new NextRequest("https://example.test/admin/registrations/export?scope=current"))).rejects.toThrow("unauthorized");
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it("returns a non-cacheable CSV download for the selected list", async () => {
    const response = await GET(new NextRequest("https://example.test/admin/registrations/export?scope=current"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toContain("bayn-current-registrations.csv");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.text()).toContain("لقاء القراءة");
  });

  it("rejects an unknown export scope before querying registrations", async () => {
    const response = await GET(new NextRequest("https://example.test/admin/registrations/export?scope=all"));

    expect(response.status).toBe(400);
    expect(mocks.list).not.toHaveBeenCalled();
  });
});
