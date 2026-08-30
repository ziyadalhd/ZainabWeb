import { describe, expect, it } from "vitest";
import { buildDaySummary, buildGreeting } from "@/features/admin/day-briefing";

describe("buildGreeting", () => {
  it("greets with صباح الخير before noon in Riyadh", () => {
    expect(buildGreeting(new Date("2026-08-30T05:00:00.000Z").getTime())).toBe("صباح الخير"); // 08:00 Riyadh
  });

  it("greets with مساء الخير from noon onward in Riyadh", () => {
    expect(buildGreeting(new Date("2026-08-30T09:30:00.000Z").getTime())).toBe("مساء الخير"); // 12:30 Riyadh
  });
});

describe("buildDaySummary", () => {
  it("describes a calm day when nothing is scheduled and nothing needs attention", () => {
    expect(buildDaySummary(0, 0)).toBe("يوم هادئ — لا فعاليات ولا مهام تحتاج عنايتك.");
  });

  it("uses the singular event form and states there is nothing to handle", () => {
    expect(buildDaySummary(1, 0)).toBe("أمامك اليوم فعالية واحدة، ولا مهام تحتاج عنايتك الآن.");
  });

  it("uses the dual event form for exactly two events", () => {
    expect(buildDaySummary(2, 0)).toBe("أمامك اليوم فعاليتان، ولا مهام تحتاج عنايتك الآن.");
  });

  it("uses the plural event form for three or more events", () => {
    expect(buildDaySummary(4, 0)).toBe("أمامك اليوم ٤ فعاليات، ولا مهام تحتاج عنايتك الآن.");
  });

  it("describes tasks without events, using the singular task form", () => {
    expect(buildDaySummary(0, 1)).toBe("لا فعاليات مجدولة اليوم، وأمامك مهمة واحدة.");
  });

  it("describes tasks without events, using the dual task form", () => {
    expect(buildDaySummary(0, 2)).toBe("لا فعاليات مجدولة اليوم، وأمامك مهمتان.");
  });

  it("describes tasks without events, using the plural task form for eleven or more", () => {
    expect(buildDaySummary(0, 12)).toBe("لا فعاليات مجدولة اليوم، وأمامك ١٢ مهمة.");
  });

  it("combines both counts, each in its own correctly-agreeing form", () => {
    expect(buildDaySummary(2, 5)).toBe("أمامك اليوم فعاليتان و٥ مهام.");
  });
});
