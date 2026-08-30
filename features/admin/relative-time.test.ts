import { describe, expect, it } from "vitest";
import { formatDeadlineLabel, formatElapsedLabel, formatRelativeEventDay } from "@/features/admin/relative-time";

const now = new Date("2026-08-30T12:00:00.000Z").getTime();

describe("formatDeadlineLabel", () => {
  it("uses minute precision under an hour, matching the design's 'خلال ٤٠ دقيقة'", () => {
    expect(formatDeadlineLabel(now + 40 * 60_000, now)).toBe("خلال ٤٠ دقيقة");
  });

  it("uses the accusative dual for a two-hour deadline, matching the design's 'خلال ساعتين'", () => {
    expect(formatDeadlineLabel(now + 2 * 60 * 60_000, now)).toBe("خلال ساعتين");
  });

  it("falls back to day precision beyond 24 hours", () => {
    expect(formatDeadlineLabel(now + 5 * 24 * 60 * 60_000, now)).toBe("خلال ٥ أيام");
  });

  it("reports a passed deadline as due now rather than a negative duration", () => {
    expect(formatDeadlineLabel(now - 60_000, now)).toBe("الموعد حان الآن");
  });
});

describe("formatElapsedLabel", () => {
  it("uses the accusative dual for two days elapsed, matching the design's 'منذ يومين'", () => {
    expect(formatElapsedLabel(now - 2 * 24 * 60 * 60_000, now)).toBe("منذ يومين");
  });

  it("uses minute precision for a recent moment", () => {
    expect(formatElapsedLabel(now - 5 * 60_000, now)).toBe("منذ ٥ دقائق");
  });

  it("reports a future instant as now rather than a negative duration", () => {
    expect(formatElapsedLabel(now + 60_000, now)).toBe("الآن");
  });
});

describe("formatRelativeEventDay", () => {
  it("labels an event later the same Riyadh calendar day as اليوم", () => {
    expect(formatRelativeEventDay("2026-08-30T18:00:00.000Z", now)).toBe("اليوم");
  });

  it("labels an event on the next Riyadh calendar day as غدًا", () => {
    expect(formatRelativeEventDay("2026-08-31T05:00:00.000Z", now)).toBe("غدًا");
  });

  it("falls back to the full Arabic date beyond tomorrow", () => {
    const label = formatRelativeEventDay("2026-09-05T15:00:00.000Z", now);
    expect(label).toContain("سبتمبر");
  });
});
