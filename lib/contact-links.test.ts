import { describe, expect, it } from "vitest";
import { toSaudiWhatsAppUrl } from "@/lib/contact-links";

describe("toSaudiWhatsAppUrl", () => {
  it("converts local and international Saudi mobile numbers", () => {
    expect(toSaudiWhatsAppUrl("0537918640")).toBe("https://wa.me/966537918640");
    expect(toSaudiWhatsAppUrl("+966 53 791 8640")).toBe("https://wa.me/966537918640");
  });

  it("rejects incomplete values", () => {
    expect(toSaudiWhatsAppUrl("123")).toBeNull();
    expect(toSaudiWhatsAppUrl(null)).toBeNull();
  });
});
