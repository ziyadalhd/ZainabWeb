import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DayPulse } from "@/features/admin/components/DayPulse";
import type { PulseItem } from "@/features/admin/day-pulse";

const selectedDay = new Date(Date.UTC(2026, 7, 30, 12));

function hrefFor(day: Date): string {
  return `/admin?day=${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(day.getUTCDate()).padStart(2, "0")}`;
}

function makeItem(overrides: Partial<PulseItem> = {}): PulseItem {
  return {
    id: "event-1",
    href: "/admin?event=1",
    timeLabel: "١١:٠٠ ص",
    title: "نادي القراءة الصغير: حكايات من التراث",
    isEvent: true,
    audience: "children",
    capacityLabel: "١٢/١٥",
    conflictCount: 0,
    ...overrides,
  };
}

describe("DayPulse", () => {
  it("shows a calm empty state when nothing is scheduled that day", () => {
    render(<DayPulse items={[]} selectedDay={selectedDay} today={selectedDay} hrefFor={hrefFor} />);
    expect(screen.getByText("لا توجد فعاليات أو حجوزات مجدولة في هذا اليوم.")).toBeInTheDocument();
  });

  it("renders an event's audience chip and capacity alongside its title and time", () => {
    render(<DayPulse items={[makeItem()]} selectedDay={selectedDay} today={selectedDay} hrefFor={hrefFor} />);

    expect(screen.getByText("نادي القراءة الصغير: حكايات من التراث")).toBeInTheDocument();
    expect(screen.getByText("١١:٠٠ ص")).toBeInTheDocument();
    expect(screen.getByText("للأطفال")).toBeInTheDocument();
    expect(screen.getByText("السعة ١٢/١٥")).toBeInTheDocument();
  });

  it("renders a scheduled booking request without an audience chip or capacity", () => {
    const booking = makeItem({ id: "booking-1", isEvent: false, audience: null, capacityLabel: null, title: "أمسية خاصة" });
    render(<DayPulse items={[booking]} selectedDay={selectedDay} today={selectedDay} hrefFor={hrefFor} />);

    expect(screen.getByText("أمسية خاصة")).toBeInTheDocument();
    expect(screen.queryByText("للأطفال")).not.toBeInTheDocument();
    expect(screen.queryByText(/^السعة/)).not.toBeInTheDocument();
  });

  it("flags a conflicting item so a double-booking is visible on the timeline", () => {
    render(<DayPulse items={[makeItem({ conflictCount: 1 })]} selectedDay={selectedDay} today={selectedDay} hrefFor={hrefFor} />);
    expect(screen.getByText("تعارض ١")).toBeInTheDocument();
  });
});
