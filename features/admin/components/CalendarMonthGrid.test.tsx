import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalendarMonthGrid } from "@/features/admin/components/CalendarMonthGrid";

describe("CalendarMonthGrid", () => {
  it("visually anchors today's cell within the rendered month", () => {
    const month = new Date(Date.UTC(2026, 7, 15, 12));
    const today = new Date(Date.UTC(2026, 7, 20, 9));

    render(<CalendarMonthGrid items={[]} month={month} today={today} />);

    expect(screen.getAllByText("اليوم").length).toBeGreaterThan(0);
  });

  it("does not mark any cell as today when today falls in a different month", () => {
    const month = new Date(Date.UTC(2026, 7, 15, 12));
    const today = new Date(Date.UTC(2026, 8, 1, 9));

    render(<CalendarMonthGrid items={[]} month={month} today={today} />);

    expect(screen.queryByText("اليوم")).not.toBeInTheDocument();
  });
});
