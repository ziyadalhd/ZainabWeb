import { describe, expect, it } from "vitest";
import { buildCalendarItems } from "@/features/admin/calendar-items";
import type { AdminServiceRequest, Event } from "@/lib/domain/types";

const event: Event = {
  id: "event-1",
  title: "جلسة القراءة",
  kind: "club_event",
  audience: "adults",
  eventTypeLabel: "لقاء",
  startsAt: "2026-09-10T16:00:00.000Z",
  endsAt: "2026-09-10T18:00:00.000Z",
  capacity: 20,
  activeReservationCount: 0,
  priceHalalas: 0,
  posterUrl: null,
  registrationStatus: "open",
  availability: "available",
  publicationStatus: "published",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function request(overrides: Partial<AdminServiceRequest> = {}): AdminServiceRequest {
  return {
    id: "request-1",
    reference: "REQ-1",
    kind: "space_booking",
    requesterName: "نورة",
    phoneE164: "+966500000000",
    email: null,
    status: "under_review",
    requestedDate: "2026-09-10",
    requestedStartTime: "19:30:00",
    requestedEndTime: "21:30:00",
    attendeeCount: 10,
    useOrOccasionType: "لقاء خاص",
    workshopTitle: null,
    workshopDescription: null,
    workshopTargetAudience: null,
    workshopDuration: null,
    workshopExpectedAttendance: null,
    workshopRequirements: null,
    workshopPortfolioUrl: null,
    notes: null,
    offerPriceHalalas: null,
    offerTerms: null,
    offerExpiresAt: null,
    paymentStatus: "unpaid",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildCalendarItems", () => {
  it("includes published events, pending requests, and accepted bookings with overlap warnings", () => {
    const items = buildCalendarItems(
      [event],
      [request(), request({ id: "request-2", status: "accepted", requestedStartTime: "22:00:00", requestedEndTime: "23:00:00" })],
    );
    expect(items.map((item) => item.kind)).toEqual(["event", "request", "booking"]);
    expect(items[0]?.conflictCount).toBe(1);
    expect(items[1]?.conflictCount).toBe(1);
    expect(items[2]?.conflictCount).toBe(0);
    expect(items[0]?.href).toBe(`/admin/events?event=${event.id}`);
  });

  it("scopes event links to the given base path, so the same builder serves both the hub and the events list", () => {
    const items = buildCalendarItems([event], [], "/admin");
    expect(items[0]?.href).toBe(`/admin?event=${event.id}`);
  });

  it("excludes archived events, cancelled requests, workshops, and malformed schedules", () => {
    const items = buildCalendarItems(
      [{ ...event, publicationStatus: "archived" }],
      [request({ status: "cancelled" }), request({ id: "workshop", kind: "workshop_application" }), request({ id: "broken", requestedEndTime: null })],
    );
    expect(items).toEqual([]);
  });
});
