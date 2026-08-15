import { describe, expect, it } from "vitest";
import { addMinutesToSchedule, dateTimeLocalValue, formatDateInput, isQuarterHourTime, parseDateInput } from "@/lib/scheduling";

describe("scheduling helpers", () => {
  it("parses and formats Gregorian form dates without UTC shifting", () => {
    expect(formatDateInput(parseDateInput("2026-08-13")!)).toBe("2026-08-13");
    expect(parseDateInput("2026-02-31")).toBeUndefined();
  });

  it("suggests an end two hours later and crosses midnight safely", () => {
    expect(addMinutesToSchedule("2026-08-13", "18:30", 120)).toEqual({ date: "2026-08-13", time: "20:30" });
    expect(addMinutesToSchedule("2026-08-13", "23:15", 120)).toEqual({ date: "2026-08-14", time: "01:15" });
  });

  it("accepts quarter-hour values and preserves the server field format", () => {
    expect(isQuarterHourTime("17:45")).toBe(true);
    expect(isQuarterHourTime("17:42")).toBe(false);
    expect(dateTimeLocalValue("2026-08-13", "17:45")).toBe("2026-08-13T17:45");
  });
});
