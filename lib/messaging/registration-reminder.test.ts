import { describe, expect, it } from "vitest";
import {
  buildRegistrationReminderMessage,
  buildWhatsAppMessageUrl,
} from "@/lib/messaging/registration-reminder";

describe("registration reminder message", () => {
  it("uses natural guest-facing copy with the actual attendee, event, and link", () => {
    const message = buildRegistrationReminderMessage({
      attendeeName: "سارة",
      eventTitle: "أمسية الشعر",
      managementUrl: "https://example.test/bookings/person-specific-token",
    });

    expect(message).toContain("السلام عليكم سارة");
    expect(message).toContain("حياكِ في فعالية أمسية الشعر");
    expect(message).toContain("لا تؤكدي حضورك إلا إذا كنتِ متأكدة من الحضور");
    expect(message).toContain("مشاركات في قائمة الانتظار");
    expect(message).toContain("https://example.test/bookings/person-specific-token");
    expect(message).not.toContain("الرابط الآمن");
    expect(message).not.toContain("الخاص بك");
  });

  it("targets the registered Saudi mobile without exposing it in the message link", () => {
    const url = buildWhatsAppMessageUrl("+966500000001", "رسالة آمنة");

    expect(url).toBe("https://wa.me/966500000001?text=%D8%B1%D8%B3%D8%A7%D9%84%D8%A9%20%D8%A2%D9%85%D9%86%D8%A9");
  });
});
