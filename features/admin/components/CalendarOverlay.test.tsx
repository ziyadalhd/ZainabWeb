import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CalendarOverlay } from "@/features/admin/components/CalendarOverlay";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const month = new Date(Date.UTC(2026, 7, 15, 12));

function renderOverlay() {
  return render(
    <CalendarOverlay
      closeHref="/admin?day=2026-08-30"
      calendarItems={[]}
      month={month}
      monthHrefPrevious="/admin?day=2026-08-30&calendar=1&month=2026-07"
      monthHrefNext="/admin?day=2026-08-30&calendar=1&month=2026-09"
      monthHrefCurrent="/admin?day=2026-08-30&calendar=1"
    />,
  );
}

describe("CalendarOverlay", () => {
  it("opens itself as a modal dialog on mount, on the shared Overlay primitive", () => {
    renderOverlay();
    expect(screen.getByRole("dialog", { name: "التقويم الكامل" })).toHaveAttribute("open");
  });

  it("carries the month calendar and its navigation links, with the title in the same header", () => {
    renderOverlay();
    expect(screen.getByText("أغسطس ٢٠٢٦")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "السابق" })).toHaveAttribute("href", "/admin?day=2026-08-30&calendar=1&month=2026-07");
    expect(screen.getByRole("link", { name: "التالي" })).toHaveAttribute("href", "/admin?day=2026-08-30&calendar=1&month=2026-09");
  });

  it("does not duplicate the month title inside CalendarMonthGrid's own section", () => {
    renderOverlay();
    expect(screen.getAllByText("أغسطس ٢٠٢٦")).toHaveLength(1);
  });

  it("navigates to closeHref — dropping the calendar param but keeping the selected day — when closed", () => {
    push.mockClear();
    renderOverlay();

    fireEvent.click(screen.getByRole("button", { name: "إغلاق التقويم" }));

    expect(push).toHaveBeenCalledWith("/admin?day=2026-08-30", { scroll: false });
  });
});
