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

    fireEvent.change(screen.getByLabelText("الفترة", { selector: "select#event-start-time-period" }), { target: { value: "am" } });
    expect(container.querySelector<HTMLInputElement>('input[name="startTime"]')?.value).toBe("06:30");

    fireEvent.click(screen.getByRole("checkbox", { name: "تنتهي في يوم مختلف" }));
    expect(screen.getByRole("button", { name: /تاريخ النهاية/ })).toBeInTheDocument();
  });
});
