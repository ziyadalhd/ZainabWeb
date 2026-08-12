import { describe, expect, it } from "vitest";
import { validateSiteSettingsInput } from "@/lib/domain/site-settings-input";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("validateSiteSettingsInput", () => {
  it("accepts optional approved content and validated public links", () => {
    const result = validateSiteSettingsInput(form({
      contactPhone: "0537918640",
      instagramUrl: "https://instagram.com/bayn",
      tiktokUrl: "",
      clubIntroduction: "نص تعريفي",
    }));
    expect(result).toMatchObject({
      ok: true,
      value: { contactPhone: "0537918640", instagramUrl: "https://instagram.com/bayn", tiktokUrl: null },
    });
  });

  it("rejects an invalid public phone or social link", () => {
    expect(validateSiteSettingsInput(form({ contactPhone: "123" }))).toEqual({ ok: false, error: "phone" });
    expect(validateSiteSettingsInput(form({ instagramUrl: "instagram.com/bayn" }))).toEqual({ ok: false, error: "socialUrl" });
  });
});
