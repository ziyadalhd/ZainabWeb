import { describe, expect, it } from "vitest";
import { buildDayPulseItems, dayHref, getSelectedDay, isSameDay, weekOf } from "@/features/admin/day-pulse";
import type { AdminServiceRequest, Event } from "@/lib/domain/types";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title: "نادي القراءة الصغير",
    kind: "club_event",
    audience: "children",
    eventTypeLabel: "نادي قراءة",
    startsAt: "2026-08-30T08:00:00.000Z",
    endsAt: "2026-08-30T09:30:00.000Z",
    capacity: 15,
    activeReservationCount: 12,
    priceHalalas: 0,
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
    reference: "REQ-1",
    kind: "space_booking",
    requesterName: "هند",
    phoneE164: "+966500000002",
    email: null,
    status: "accepted",
    requestedDate: "2026-08-30",
    requestedStartTime: "19:00:00",
    requestedEndTime: "21:00:00",
    attendeeCount: 12,
    useOrOccasionType: "أمسية خاصة",
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

const now = new Date("2026-08-30T12:00:00.000Z").getTime();
const day = new Date(Date.UTC(2026, 7, 30, 12));

describe("getSelectedDay", () => {
  it("parses a valid YYYY-MM-DD value", () => {
    const selected = getSelectedDay("2026-08-30", now);
    expect(selected.getUTCFullYear()).toBe(2026);
    expect(selected.getUTCMonth()).toBe(7);
    expect(selected.getUTCDate()).toBe(30);
  });

  it("falls back to today in Riyadh for a missing value", () => {
    const selected = getSelectedDay(undefined, now);
    expect(isSameDay(selected, day)).toBe(true);
  });

  it("falls back to today for a malformed or impossible date", () => {
    expect(isSameDay(getSelectedDay("not-a-date", now), day)).toBe(true);
    expect(isSameDay(getSelectedDay("2026-02-30", now), day)).toBe(true);
  });
});

describe("dayHref", () => {
  it("carries extra params and shifts by the given number of days", () => {
    expect(dayHref("/admin", {}, day, 1)).toBe("/admin?day=2026-08-31");
    expect(dayHref("/admin", {}, day, -1)).toBe("/admin?day=2026-08-29");
  });
});

describe("weekOf", () => {
  it("returns the seven days of the week starting Saturday", () => {
    const week = weekOf(day); // 2026-08-30 is a Sunday
    expect(week.map((d) => d.getUTCDate())).toEqual([29, 30, 31, 1, 2, 3, 4]);
    expect(week[0]?.getUTCDay()).toBe(6);
  });

  it("keeps Saturday itself as the first day when selected", () => {
    const saturday = new Date(Date.UTC(2026, 7, 29, 12));
    const week = weekOf(saturday);
    expect(isSameDay(week[0]!, saturday)).toBe(true);
  });
});

describe("buildDayPulseItems", () => {
  it("returns nothing for an empty day", () => {
    expect(buildDayPulseItems([makeEvent({ startsAt: "2026-09-01T08:00:00.000Z", endsAt: "2026-09-01T09:00:00.000Z" })], [], day)).toEqual([]);
  });

  it("carries the audience and Arabic-numeral capacity for a single event", () => {
    const [item] = buildDayPulseItems([makeEvent()], [], day);
    expect(item?.isEvent).toBe(true);
    expect(item?.audience).toBe("children");
    expect(item?.capacityLabel).toBe("١٢/١٥");
    expect(item?.timeLabel).toContain("١١");
  });

  it("marks a scheduled booking request as non-event, with no audience chip", () => {
    const [item] = buildDayPulseItems([], [makeRequest()], day);
    expect(item?.isEvent).toBe(false);
    expect(item?.audience).toBeNull();
    expect(item?.capacityLabel).toBeNull();
  });

  it("surfaces the conflict count for overlapping items on the same day", () => {
    // Event: 21:00-23:00 Riyadh (18:00-20:00Z). Request: 21:30-22:30 Riyadh local, converted
    // to UTC by requestDateTime — the two overlap between 21:30 and 22:30 Riyadh.
    const event = makeEvent({ startsAt: "2026-08-30T18:00:00.000Z", endsAt: "2026-08-30T20:00:00.000Z" });
    const overlapping = makeRequest({ status: "accepted", requestedStartTime: "21:30:00", requestedEndTime: "22:30:00" });
    const items = buildDayPulseItems([event], [overlapping], day);
    expect(items).toHaveLength(2);
    expect(items.every((item) => item.conflictCount === 1)).toBe(true);
  });

  it("scopes event links to the given base path", () => {
    const event = makeEvent();
    const [item] = buildDayPulseItems([event], [], day, "/admin/events");
    expect(item?.href).toBe(`/admin/events?event=${event.id}`);
  });
});
