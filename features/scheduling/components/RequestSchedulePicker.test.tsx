import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestSchedulePicker } from "@/features/scheduling/components/RequestSchedulePicker";

describe("RequestSchedulePicker", () => {
  beforeEach(() => {
    // Pin "today" so the calendar opens on August 2026 regardless of the real date.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-08-01T09:00:00+03:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the same quarter-hour choices and submits the approved field names", () => {
    const { container } = render(<RequestSchedulePicker />);
    fireEvent.click(screen.getByRole("button", { name: /اليوم والتاريخ/ }));
    fireEvent.click(screen.getByRole("button", { name: /الخميس, أغسطس ٢٠, ٢٠٢٦/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "٣٠ ونصف" })[0]);

    expect(container.querySelector<HTMLInputElement>('input[name="requestedDate"]')?.value).toBe("2026-08-20");
    expect(container.querySelector<HTMLInputElement>('input[name="requestedStartTime"]')?.value).toBe("18:30");
    expect(container.querySelector<HTMLInputElement>('input[name="requestedEndTime"]')?.value).toBe("20:30");
    expect(screen.getByText("الخميس، ٢٠ أغسطس ٢٠٢٦ · من ٦:٣٠ إلى ٨:٣٠ مساءً")).toBeInTheDocument();
  });
});
