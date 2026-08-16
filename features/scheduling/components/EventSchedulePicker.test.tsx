import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventSchedulePicker } from "@/features/scheduling/components/EventSchedulePicker";

describe("EventSchedulePicker", () => {
  it("suggests two hours, switches between AM and PM, and preserves hidden server fields", () => {
    const { container } = render(
      <EventSchedulePicker defaultStartDate="2026-08-13" defaultStartTime="18:30" />,
    );

    expect(container.querySelector<HTMLInputElement>('input[name="startDate"]')?.value).toBe("2026-08-13");
    expect(container.querySelector<HTMLInputElement>('input[name="startTime"]')?.value).toBe("18:30");
    expect(container.querySelector<HTMLInputElement>('input[name="endDate"]')?.value).toBe("2026-08-13");
    expect(container.querySelector<HTMLInputElement>('input[name="endTime"]')?.value).toBe("20:30");
    expect(screen.getByText("الخميس، ١٣ أغسطس ٢٠٢٦ · من ٦:٣٠ إلى ٨:٣٠ مساءً")).toBeInTheDocument();
    expect(screen.getAllByRole("option", { name: "٦" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "٣٠ ونصف" })).toHaveLength(2);
    for (const button of screen.getAllByRole("button", { name: "٣٠ ونصف" })) {
      expect(button).toHaveAttribute("aria-pressed", "true");
    }

    fireEvent.change(screen.getByLabelText("الفترة", { selector: "select#event-start-time-period" }), { target: { value: "am" } });
    expect(container.querySelector<HTMLInputElement>('input[name="startTime"]')?.value).toBe("06:30");

    fireEvent.click(screen.getByRole("checkbox", { name: "تنتهي في يوم مختلف" }));
    expect(screen.getByRole("button", { name: /تاريخ النهاية/ })).toBeInTheDocument();
  });

  it("opens an Arabic RTL calendar and closes it with Escape", () => {
    render(<EventSchedulePicker defaultStartDate="2026-08-20" defaultStartTime="18:00" />);
    const dateButton = screen.getByRole("button", { name: /اليوم والتاريخ/ });
    fireEvent.click(dateButton);
    const calendar = screen.getByRole("region", { name: "تقويم اليوم والتاريخ" });
    expect(calendar.querySelector(".rdp-root")).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("button", { name: "الشهر السابق" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /الخميس, أغسطس ٢٠, ٢٠٢٦/ })).toBeInTheDocument();
    fireEvent.keyDown(calendar, { key: "Escape" });
    expect(screen.queryByRole("region", { name: "تقويم اليوم والتاريخ" })).not.toBeInTheDocument();
    expect(dateButton).toHaveFocus();
  });
});
