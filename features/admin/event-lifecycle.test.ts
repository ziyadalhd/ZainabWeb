import { describe, expect, it } from "vitest";
import { eventLifecycle } from "@/features/admin/event-lifecycle";
import type { Event, EventPublicationStatus } from "@/lib/domain/types";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title: "ليلة أدبية",
    kind: "club_event",
    audience: "adults",
    eventTypeLabel: "أمسية حوارية",
    startsAt: "2026-08-30T16:00:00.000Z",
    endsAt: "2026-08-30T18:00:00.000Z",
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

describe("eventLifecycle", () => {
  it.each<EventPublicationStatus>(["cancelled", "archived", "draft"])(
    "returns the publication status directly for %s events regardless of schedule",
    (publicationStatus) => {
      const event = makeEvent({ publicationStatus, startsAt: "2020-01-01T00:00:00.000Z", endsAt: "2020-01-01T02:00:00.000Z" });
      expect(eventLifecycle(event, new Date("2026-08-30T17:00:00.000Z"))).toBe(publicationStatus);
    },
  );

  it("is upcoming before the start time", () => {
    const event = makeEvent();
    expect(eventLifecycle(event, new Date("2026-08-30T15:59:59.999Z"))).toBe("upcoming");
  });

  it("is live exactly at the start time", () => {
    const event = makeEvent();
    expect(eventLifecycle(event, new Date("2026-08-30T16:00:00.000Z"))).toBe("live");
  });

  it("is live in the middle of the event", () => {
    const event = makeEvent();
    expect(eventLifecycle(event, new Date("2026-08-30T17:00:00.000Z"))).toBe("live");
  });

  it("is past exactly at the end time", () => {
    const event = makeEvent();
    expect(eventLifecycle(event, new Date("2026-08-30T18:00:00.000Z"))).toBe("past");
  });

  it("is past well after the end time", () => {
    const event = makeEvent();
    expect(eventLifecycle(event, new Date("2026-09-01T00:00:00.000Z"))).toBe("past");
  });

  it("falls back to a two-hour default duration when endsAt is null", () => {
    const event = makeEvent({ endsAt: null });
    expect(eventLifecycle(event, new Date("2026-08-30T17:30:00.000Z"))).toBe("live");
    expect(eventLifecycle(event, new Date("2026-08-30T18:00:00.000Z"))).toBe("past");
  });
});
