import { describe, expect, it } from "vitest";
import {
  formatArabicDateTime,
  formatArabicEventDate,
  formatArabicEventTimeRange,
  formatArabicTimeInput,
  formatArabicNumber,
  formatArabicRequestedSchedule,
  formatEventPrice,
  formatSeatCapacity,
  formatRiyadhDateInput,
  formatRiyadhDateTimeLocal,
  formatRiyadhTimeInput,
  getRiyadhDateParts,
} from "@/lib/format/date";

describe("Arabic formatting", () => {
  it("uses Arabic digits for numbers", () => {
    expect(formatArabicNumber(123)).toBe("١٢٣");
    expect(formatSeatCapacity(1)).toBe("مقعد واحد");
    expect(formatSeatCapacity(2)).toBe("مقعدان");
    expect(formatSeatCapacity(5)).toBe("٥ مقاعد");
    expect(formatSeatCapacity(11)).toBe("١١ مقعدًا");
  });

  it("formats a Gregorian date in the Riyadh time zone", () => {
    const formatted = formatArabicDateTime("2026-08-10T18:00:00+03:00");
    expect(formatted).toContain("٢٠٢٦");
    expect(formatted).toContain("٦:٠٠");
  });

  it("formats an event as an Arabic weekday, date, and time range", () => {
    const startsAt = "2026-08-11T15:00:00.000Z";
    const endsAt = "2026-08-11T17:30:00.000Z";
    expect(formatArabicEventDate(startsAt)).toContain("الثلاثاء");
    expect(formatArabicEventDate(startsAt)).toContain("أغسطس");
    expect(formatArabicEventTimeRange(startsAt, endsAt)).toBe("من ٦ إلى ٨:٣٠ مساءً");
    expect(formatArabicEventTimeRange("2026-08-11T07:30:00.000Z", "2026-08-11T10:00:00.000Z"))
      .toBe("من ١٠:٣٠ صباحًا إلى ١ مساءً");
  });

  it("formats a requested local schedule without exposing database date or time syntax", () => {
    const formatted = formatArabicRequestedSchedule("2026-08-13", "20:30:00", "21:45:00");
    expect(formatted).toContain("الخميس");
    expect(formatted).toContain("أغسطس");
    expect(formatted).toContain("٨:٣٠");
    expect(formatted).toContain("٩:٤٥");
    expect(formatted).not.toContain("2026-08-13");
    expect(formatArabicRequestedSchedule(null, null, null)).toBe("الموعد غير مكتمل");
  });

  it("formats a local time choice in conversational Arabic", () => {
    expect(formatArabicTimeInput("18:45")).toBe("٦:٤٥ مساءً");
    expect(formatArabicTimeInput("08:00")).toBe("٨ صباحًا");
  });

  it("returns stable Riyadh parts independent of the server time zone", () => {
    expect(getRiyadhDateParts("2026-08-10T21:30:00.000Z")).toMatchObject({ year: 2026, month: 8, day: 11, hour: 0, minute: 30 });
    expect(formatRiyadhDateTimeLocal("2026-08-10T15:00:00.000Z")).toBe("2026-08-10T18:00");
    expect(formatRiyadhDateInput("2026-08-10T15:00:00.000Z")).toBe("2026-08-10");
    expect(formatRiyadhTimeInput("2026-08-10T15:00:00.000Z")).toBe("18:00");
  });

  it("formats event prices without inventing a missing value", () => {
    expect(formatEventPrice(0)).toBe("مجانية");
    expect(formatEventPrice(null)).toBe("السعر غير محدد");
    expect(formatEventPrice(1000)).toBe("١٠ ريال");
    expect(formatEventPrice(7550)).toBe("٧٥٫٥ ريال");
    expect(formatEventPrice(1000)).not.toContain(".");
  });
});
