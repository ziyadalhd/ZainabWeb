import { describe, expect, it } from "vitest";
import {
  countEventsByStatus,
  filterEvents,
  parseEventAudienceFilter,
  parseEventStatusFilter,
} from "@/features/admin/event-filters";
import type { Event } from "@/lib/domain/types";

const now = new Date("2026-08-30T12:00:00.000Z");

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title: "ليلة أدبية",
    kind: "club_event",
    audience: "adults",
    eventTypeLabel: "أمسية حوارية",
    startsAt: "2026-09-01T16:00:00.000Z",
    endsAt: "2026-09-01T18:00:00.000Z",
    capacity: 30,
    activeReservationCount: 28,
    priceHalalas: 25000,
    posterUrl: null,
    registrationStatus: "open",
    availability: "available",
    publicationStatus: "published",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("parseEventStatusFilter", () => {
  it("defaults to upcoming for a missing or unknown value", () => {
    expect(parseEventStatusFilter(undefined)).toBe("upcoming");
    expect(parseEventStatusFilter("not-real")).toBe("upcoming");
  });

  it("accepts every known status", () => {
    expect(parseEventStatusFilter("all")).toBe("all");
    expect(parseEventStatusFilter("draft")).toBe("draft");
    expect(parseEventStatusFilter("archived")).toBe("archived");
  });
});

describe("parseEventAudienceFilter", () => {
  it("defaults to all for a missing or unknown value", () => {
    expect(parseEventAudienceFilter(undefined)).toBe("all");
    expect(parseEventAudienceFilter("not-real")).toBe("all");
  });

  it("accepts every known audience", () => {
    expect(parseEventAudienceFilter("youth")).toBe("youth");
    expect(parseEventAudienceFilter("children")).toBe("children");
  });
});

describe("filterEvents", () => {
  const upcoming = makeEvent({ id: "1", audience: "adults", title: "ليلة أدبية" });
  const draft = makeEvent({ id: "2", audience: "youth", title: "ورشة الخط", publicationStatus: "draft" });
  const past = makeEvent({ id: "3", audience: "children", title: "يوم الفنون", startsAt: "2026-01-01T10:00:00.000Z", endsAt: "2026-01-01T12:00:00.000Z" });
  const cancelled = makeEvent({ id: "4", audience: "adults", title: "أمسية ملغاة", publicationStatus: "cancelled" });
  const archived = makeEvent({ id: "5", audience: "adults", title: "فعالية مؤرشفة", publicationStatus: "archived" });
  const all = [upcoming, draft, past, cancelled, archived];

  it("filters by status bucket", () => {
    expect(filterEvents(all, { status: "upcoming", audience: "all", query: "", now }).map((e) => e.id)).toEqual(["1"]);
    expect(filterEvents(all, { status: "draft", audience: "all", query: "", now }).map((e) => e.id)).toEqual(["2"]);
    expect(filterEvents(all, { status: "archived", audience: "all", query: "", now }).map((e) => e.id)).toEqual(["5"]);
  });

  it("groups cancelled events under the past bucket", () => {
    expect(filterEvents(all, { status: "past", audience: "all", query: "", now }).map((e) => e.id).sort()).toEqual(["3", "4"]);
  });

  it("filters by audience", () => {
    expect(filterEvents(all, { status: "all", audience: "youth", query: "", now }).map((e) => e.id)).toEqual(["2"]);
  });

  it("filters by a case-insensitive title or type substring", () => {
    expect(filterEvents(all, { status: "all", audience: "all", query: "الخط", now }).map((e) => e.id)).toEqual(["2"]);
  });

  it("combines status, audience and query", () => {
    expect(filterEvents(all, { status: "all", audience: "adults", query: "ملغاة", now }).map((e) => e.id)).toEqual(["4"]);
  });

  it("returns everything for the all status with no other filters", () => {
    expect(filterEvents(all, { status: "all", audience: "all", query: "", now })).toHaveLength(5);
  });
});

describe("countEventsByStatus", () => {
  it("counts each bucket including cancelled folded into past", () => {
    const events = [
      makeEvent({ id: "1" }),
      makeEvent({ id: "2", publicationStatus: "draft" }),
      makeEvent({ id: "3", startsAt: "2026-01-01T10:00:00.000Z", endsAt: "2026-01-01T12:00:00.000Z" }),
      makeEvent({ id: "4", publicationStatus: "cancelled" }),
      makeEvent({ id: "5", publicationStatus: "archived" }),
    ];
    expect(countEventsByStatus(events, now)).toEqual({ all: 5, upcoming: 1, live: 0, draft: 1, past: 2, archived: 1 });
  });
});
