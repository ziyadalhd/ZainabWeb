import { describe, expect, it } from "vitest";
import {
  buildRegistrationsCsv,
  filterRegistrationsForExport,
  isRegistrationExportScope,
} from "@/lib/export/registrations-csv";
import type { Registration } from "@/lib/domain/types";

const currentRegistration: Registration = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  reference: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  eventId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  eventTitle: "لقاء القراءة",
  eventStartsAt: "2026-08-12T15:00:00.000Z",
  attendeeName: "مشاركة",
  phoneE164: "+966500000001",
  email: "participant@example.test",
  participantAge: null,
  guardianName: null,
  guardianConsent: false,
  priceHalalasAtBooking: 5000,
  status: "registered",
  attendanceStatus: "pending",
  invitationExpiresAt: null,
  createdAt: "2026-08-09T15:00:00.000Z",
};

describe("registration CSV export", () => {
  it("limits each export to its matching operational list", () => {
    const past = { ...currentRegistration, id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", eventStartsAt: "2026-08-08T15:00:00.000Z" };
    const waitlisted = { ...currentRegistration, id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", status: "waitlisted" as const };
    const cancelled = { ...currentRegistration, id: "ffffffff-ffff-4fff-8fff-ffffffffffff", status: "cancelled" as const };
    const registrations = [currentRegistration, past, waitlisted, cancelled];
    const now = new Date("2026-08-09T18:00:00.000Z");

    expect(filterRegistrationsForExport(registrations, "current", now)).toEqual([currentRegistration]);
    expect(filterRegistrationsForExport(registrations, "previous", now)).toEqual([past, cancelled]);
    expect(filterRegistrationsForExport(registrations, "waitlist", now)).toEqual([waitlisted]);
  });

  it("returns only accepted scopes", () => {
    expect(isRegistrationExportScope("current")).toBe(true);
    expect(isRegistrationExportScope("all")).toBe(false);
    expect(isRegistrationExportScope(null)).toBe(false);
  });

  it("writes Arabic headers and prevents spreadsheet formula execution", () => {
    const csv = buildRegistrationsCsv([{ ...currentRegistration, attendeeName: "=UNSAFE()", email: null }]);

    expect(csv).toMatch(/^\uFEFF"رقم المرجع"/);
    expect(csv).toContain("\"'=UNSAFE()\"");
    expect(csv).toContain("\"بانتظار التأكيد\"");
    expect(csv).toContain("\"\"");
  });
});
