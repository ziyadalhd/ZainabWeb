import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PastEventList } from "@/features/events/components/PastEventList";
import type { PastEvent } from "@/lib/domain/types";

const event: PastEvent = {
  id: "1", title: "قلبي دليلي", kind: "club_event", audiences: ["adults"], eventTypeLabel: "لقاء",
  description: null, startsAt: "2026-09-01T15:00:00.000Z", endsAt: "2026-09-01T17:00:00.000Z", posterUrl: null,
};

describe("PastEventList", () => {
  it("shows every past event under its own heading, reachable at #past", () => {
    render(<PastEventList events={[event, { ...event, id: "2", title: "مجالسة مع كتاب" }]} />);

    expect(screen.getByRole("region", { name: "فعاليات سابقة" })).toHaveAttribute("id", "past");
    expect(screen.getByRole("heading", { name: "قلبي دليلي" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "مجالسة مع كتاب" })).toBeInTheDocument();
  });

  it("renders nothing before any event has ended", () => {
    const { container } = render(<PastEventList events={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
