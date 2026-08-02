import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventList } from "@/features/events/components/EventList";
import { demoEvents } from "@/lib/demo/events";

describe("EventList", () => {
  it("renders the Arabic empty state", () => {
    render(<EventList events={[]} />);
    expect(screen.getByRole("heading", { name: "لا توجد فعاليات حاليًا" })).toBeInTheDocument();
  });

  it("renders all demonstration events and audience labels", () => {
    render(<EventList events={demoEvents} />);
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByText("الكبار")).toBeInTheDocument();
    expect(screen.getByText("اليافعون")).toBeInTheDocument();
    expect(screen.getByText("الصغار")).toBeInTheDocument();
  });
});
