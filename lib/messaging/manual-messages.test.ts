import { describe, expect, it } from "vitest";
import {
  buildManualMessageContent,
  getDefaultManualMessageKind,
  isManualMessageKind,
  manualMessageKinds,
  manualMessageLabels,
} from "@/lib/messaging/manual-messages";

describe("manual event messages", () => {
  it("renders the six approved categories with clear Arabic labels", () => {
    expect(manualMessageKinds).toEqual([
      "confirmation",
      "reminder_24h",
      "reminder_3h",
      "waitlist_invitation",
      "cancellation",
      "feedback_request",
    ]);
    expect(manualMessageLabels.cancellation).toBe("إشعار الإلغاء");
  });

  it("renders a confirmation with its recipient-specific management link", () => {
    const message = buildManualMessageContent({
      kind: "confirmation",
      attendeeName: "نورة",
      eventTitle: "مجالسة مع كتاب",
      eventDate: "الخميس ٢٠ أغسطس",
      secureUrl: "https://example.test/bookings/secure-token",
    });

    expect(message).toContain("تم تسجيلك");
    expect(message).toContain("نورة");
    expect(message).toContain("https://example.test/bookings/secure-token");
  });

  it("uses the approved standard cancellation message without a custom reason", () => {
    const message = buildManualMessageContent({
      kind: "cancellation",
      attendeeName: "سارة",
      eventTitle: "أمسية ثقافية",
      eventDate: "الخميس ٢٠ أغسطس",
      secureUrl: null,
    });

    expect(message).toContain("أُلغيت فعالية أمسية ثقافية");
    expect(message).not.toContain("السبب");
    expect(message).not.toContain("undefined");
  });

  it("selects the lifecycle-appropriate default category", () => {
    const now = new Date("2026-08-20T12:00:00.000Z");
    expect(getDefaultManualMessageKind({ publicationStatus: "cancelled", eventStartsAt: "2026-08-21T12:00:00.000Z", eventEndsAt: null, now })).toBe("cancellation");
    expect(getDefaultManualMessageKind({ publicationStatus: "published", eventStartsAt: "2026-08-19T10:00:00.000Z", eventEndsAt: "2026-08-19T12:00:00.000Z", now })).toBe("feedback_request");
    expect(getDefaultManualMessageKind({ publicationStatus: "published", eventStartsAt: "2026-08-21T12:00:00.000Z", eventEndsAt: null, now })).toBe("confirmation");
  });

  it("rejects unknown message categories", () => {
    expect(isManualMessageKind("confirmation")).toBe(true);
    expect(isManualMessageKind("delivered")).toBe(false);
  });
});
