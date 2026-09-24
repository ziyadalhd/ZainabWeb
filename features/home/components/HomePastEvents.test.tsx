import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePastEvents, selectHomePastEvents } from "@/features/home/components/HomePastEvents";
import type { PastEvent } from "@/lib/domain/types";

const baseEvent: PastEvent = {
  id: "1", title: "صبوحية بَيْن", kind: "club_event", audiences: ["adults"], eventTypeLabel: "لقاء صباحي",
  description: null, startsAt: "2026-09-14T06:00:00.000Z", endsAt: "2026-09-14T08:00:00.000Z", posterUrl: null,
};

describe("HomePastEvents", () => {
  it("keeps only the two most recent events", () => {
    const events = [baseEvent, { ...baseEvent, id: "2" }, { ...baseEvent, id: "3" }];
    expect(selectHomePastEvents(events).map((event) => event.id)).toEqual(["1", "2"]);
  });

  it("shows past events on the home page with a link to the full archive", () => {
    render(<HomePastEvents events={[baseEvent]} />);

    expect(screen.getByRole("heading", { name: "فعاليات سابقة" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "صبوحية بَيْن" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "عرض الفعاليات السابقة" })).toHaveAttribute("href", "/events#past");
  });

  it("renders nothing before any event has ended", () => {
    const { container } = render(<HomePastEvents events={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
