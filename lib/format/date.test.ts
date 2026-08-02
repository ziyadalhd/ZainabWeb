import { describe, expect, it } from "vitest";
import { formatArabicDateTime, formatArabicNumber } from "@/lib/format/date";

describe("Arabic formatting", () => {
  it("uses Arabic digits for numbers", () => {
    expect(formatArabicNumber(123)).toBe("١٢٣");
  });

  it("formats a Gregorian date in the Riyadh time zone", () => {
    const formatted = formatArabicDateTime("2026-08-10T18:00:00+03:00");
    expect(formatted).toContain("٢٠٢٦");
    expect(formatted).toContain("٦:٠٠");
  });
});
