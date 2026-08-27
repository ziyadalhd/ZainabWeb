import { describe, expect, it } from "vitest";
import { getCalendarMonth, monthHref } from "@/features/admin/calendar-month";

describe("getCalendarMonth", () => {
  it("parses a valid YYYY-MM value", () => {
    const month = getCalendarMonth("2026-03");
    expect(month.getUTCFullYear()).toBe(2026);
    expect(month.getUTCMonth()).toBe(2);
  });

  it("falls back to the current month for a missing or malformed value", () => {
    const fallback = getCalendarMonth(undefined);
    const now = new Date();
    expect(fallback.getUTCFullYear()).toBe(now.getUTCFullYear());
  });
});

describe("monthHref", () => {
  it("carries extra params and shifts the month by the given offset", () => {
    const month = new Date(Date.UTC(2026, 7, 15, 12));
    expect(monthHref("/admin/events", { view: "calendar" }, month, -1)).toBe("/admin/events?view=calendar&month=2026-07");
    expect(monthHref("/admin/events", { view: "calendar" }, month, 1)).toBe("/admin/events?view=calendar&month=2026-09");
  });

  it("works without extra params for the hub", () => {
    const month = new Date(Date.UTC(2026, 0, 15, 12));
    expect(monthHref("/admin", {}, month, 1)).toBe("/admin?month=2026-02");
  });
});
