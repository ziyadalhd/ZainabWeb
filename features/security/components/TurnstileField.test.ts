import { describe, expect, it } from "vitest";
import { getTurnstileRenderOptions } from "@/features/security/components/TurnstileField";

describe("TurnstileField", () => {
  it("uses the flexible Arabic widget configuration", () => {
    expect(getTurnstileRenderOptions("site-key")).toEqual({
      sitekey: "site-key",
      language: "ar",
      theme: "light",
      size: "flexible",
    });
  });
});
