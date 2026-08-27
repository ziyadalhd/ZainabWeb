import { describe, expect, it } from "vitest";
import { matchEvents, matchRequests } from "@/features/admin/admin-search";
import type { AdminServiceRequest, Event } from "@/lib/domain/types";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title: "لقاء القراءة الشهري",
    kind: "club_event",
    audience: "adults",
    eventTypeLabel: "قراءة",
    startsAt: "2026-08-25T15:00:00.000Z",
    endsAt: "2026-08-25T17:00:00.000Z",
    capacity: 20,
    activeReservationCount: 4,
    priceHalalas: 7500,
    posterUrl: null,
    registrationStatus: "open",
    availability: "available",
    publicationStatus: "published",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeRequest(overrides: Partial<AdminServiceRequest> = {}): AdminServiceRequest {
  return {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    reference: "REQ-42",
    kind: "space_booking",
    requesterName: "نورة العتيبي",
    phoneE164: "+966500000002",
    email: null,
    status: "new",
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
    createdAt: "2026-08-19T00:00:00.000Z",
    contactedAt: null,
    ...overrides,
  };
}

describe("matchEvents", () => {
  it("matches by title, case-insensitively", () => {
    const event = makeEvent();
    expect(matchEvents([event], "القراءة", 8)).toEqual([event]);
    expect(matchEvents([event], "قراءة", 8)).toEqual([event]);
  });

  it("matches by event type label", () => {
    const event = makeEvent({ eventTypeLabel: "ورشة كتابة" });
    expect(matchEvents([event], "كتابة", 8)).toEqual([event]);
  });

  it("excludes events that do not match", () => {
    const event = makeEvent();
    expect(matchEvents([event], "رحلة بين", 8)).toEqual([]);
  });

  it("caps results at the given limit", () => {
    const events = Array.from({ length: 5 }, (_, index) => makeEvent({ id: `event-${index}`, title: `لقاء ${index}` }));
    expect(matchEvents(events, "لقاء", 3)).toHaveLength(3);
  });
});

describe("matchRequests", () => {
  it("matches by requester name", () => {
    const request = makeRequest();
    expect(matchRequests([request], "نورة", 8)).toEqual([request]);
  });

  it("matches a workshop application by its title", () => {
    const request = makeRequest({ kind: "workshop_application", workshopTitle: "ورشة الخط العربي", useOrOccasionType: null });
    expect(matchRequests([request], "الخط العربي", 8)).toEqual([request]);
  });

  it("matches by reference and phone number", () => {
    const request = makeRequest();
    expect(matchRequests([request], "REQ-42", 8)).toEqual([request]);
    expect(matchRequests([request], "500000002", 8)).toEqual([request]);
  });

  it("excludes requests that do not match", () => {
    const request = makeRequest();
    expect(matchRequests([request], "سارة", 8)).toEqual([]);
  });
});
