import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeekStrip } from "@/features/admin/components/WeekStrip";

const selectedDay = new Date(Date.UTC(2026, 7, 30, 12)); // Sunday
const today = selectedDay;

function hrefFor(day: Date): string {
  return `/admin?day=${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(day.getUTCDate()).padStart(2, "0")}`;
}

describe("WeekStrip", () => {
  it("renders the seven days of the week, Saturday first, each linking through the given href builder", () => {
    render(<WeekStrip selectedDay={selectedDay} today={today} hrefFor={hrefFor} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(7);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/admin?day=2026-08-29",
      "/admin?day=2026-08-30",
      "/admin?day=2026-08-31",
      "/admin?day=2026-09-01",
      "/admin?day=2026-09-02",
      "/admin?day=2026-09-03",
      "/admin?day=2026-09-04",
    ]);
  });

  it("marks only the selected day as the current date for assistive technology", () => {
    render(<WeekStrip selectedDay={selectedDay} today={today} hrefFor={hrefFor} />);

    const current = screen.getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "date");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("href", "/admin?day=2026-08-30");
  });

  it("distinguishes today from the selected day when they differ", () => {
    const differentSelection = new Date(Date.UTC(2026, 8, 2, 12));
    render(<WeekStrip selectedDay={differentSelection} today={today} hrefFor={hrefFor} />);

    const links = screen.getAllByRole("link");
    const selectedLink = links.find((link) => link.getAttribute("href") === "/admin?day=2026-09-02");
    const todayLink = links.find((link) => link.getAttribute("href") === "/admin?day=2026-08-30");
    expect(selectedLink?.className).toContain("week-strip__day--selected");
    expect(todayLink?.className).toContain("week-strip__day--today");
    expect(todayLink?.className).not.toContain("week-strip__day--selected");
  });
});
