import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PastEventCard } from "@/features/events/components/PastEventCard";
import type { PastEvent } from "@/lib/domain/types";

const event: PastEvent = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  title: "صبوحية بَيْن",
  kind: "club_event",
  audiences: ["adults"],
  eventTypeLabel: "لقاء صباحي",
  description: "قهوة وحديث عن الكتب",
  startsAt: "2026-09-14T06:00:00.000Z",
  endsAt: "2026-09-14T08:00:00.000Z",
  posterUrl: null,
};

describe("PastEventCard", () => {
  it("shows what the event was and when it happened", () => {
    render(<PastEventCard event={event} />);

    expect(screen.getByRole("heading", { name: "صبوحية بَيْن" })).toBeInTheDocument();
    expect(screen.getByText("قهوة وحديث عن الكتب")).toBeInTheDocument();
  });

  it("offers no way to register, because the event is over", () => {
    render(<PastEventCard event={event} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("المقاعد")).not.toBeInTheDocument();
  });

  it("falls back to the event type when there is no poster", () => {
    render(<PastEventCard event={event} />);

    expect(screen.getAllByText("لقاء صباحي").length).toBeGreaterThan(0);
  });
});
