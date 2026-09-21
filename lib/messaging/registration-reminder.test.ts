import { describe, expect, it } from "vitest";
import { buildWhatsAppMessageUrl } from "@/lib/messaging/registration-reminder";

describe("whatsapp message url", () => {
  it("targets the registered Saudi mobile without exposing it in the message link", () => {
    const url = buildWhatsAppMessageUrl("+966500000001", "رسالة آمنة");

    expect(url).toBe("https://wa.me/966500000001?text=%D8%B1%D8%B3%D8%A7%D9%84%D8%A9%20%D8%A2%D9%85%D9%86%D8%A9");
  });
});
