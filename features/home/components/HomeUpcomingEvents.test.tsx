import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeUpcomingEvents, selectHomeEvents } from "@/features/home/components/HomeUpcomingEvents";
import type { Event } from "@/lib/domain/types";

const baseEvent: Event = {
  id: "1", title: "فعالية أولى", kind: "club_event", audience: "adults", eventTypeLabel: "لقاء",
  startsAt: "2026-08-20T15:00:00.000Z", endsAt: "2026-08-20T17:00:00.000Z", capacity: 12,
  activeReservationCount: 0, priceHalalas: 0, posterUrl: null, registrationStatus: "open",
  availability: "available", publicationStatus: "published", createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z",
};

describe("HomeUpcomingEvents", () => {
  it("keeps only the nearest two events", () => {
    const events = [baseEvent, { ...baseEvent, id: "2" }, { ...baseEvent, id: "3" }];
    expect(selectHomeEvents(events).map((event) => event.id)).toEqual(["1", "2"]);
  });

  it("shows a friendly empty state", () => {
    render(<HomeUpcomingEvents events={[]} />);
    expect(screen.getByRole("heading", { name: "ما فيه فعاليات معلنة الآن" })).toBeInTheDocument();
  });
});
