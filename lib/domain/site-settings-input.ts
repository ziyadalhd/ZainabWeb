import type { SiteSettingsInput } from "@/lib/domain/types";

const shortTextFields = new Set([
  "contactPhone",
  "defaultVenueName",
  "defaultVenueAddress",
  "defaultVenueMapUrl",
  "literaryPartnerTitle",
  "instagramUrl",
  "tiktokUrl",
]);

const longTextFields = new Set([
  "clubIntroduction",
  "nameStory",
  "objectives",
  "literaryPartnerBody",
]);

export type SiteSettingsInputError = "phone" | "url" | "text";
export type SiteSettingsInputResult =
  | { ok: true; value: SiteSettingsInput }
  | { ok: false; error: SiteSettingsInputError };

function normalized(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function isWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function validateSiteSettingsInput(formData: FormData): SiteSettingsInputResult {
  const values = Object.fromEntries([...shortTextFields, ...longTextFields].map((key) => [key, normalized(formData, key)])) as Record<string, string | null>;
  if (values.contactPhone !== null && !/^05\d{8}$/.test(values.contactPhone)) return { ok: false, error: "phone" };
  if ([values.defaultVenueMapUrl, values.instagramUrl, values.tiktokUrl].some((value) => value !== null && !isWebUrl(value))) return { ok: false, error: "url" };
  if (
    [...longTextFields].some((key) => (values[key]?.length ?? 0) > 4000)
    || (values.defaultVenueName?.length ?? 0) > 250
    || (values.defaultVenueAddress?.length ?? 0) > 500
    || (values.literaryPartnerTitle?.length ?? 0) > 250
    || (values.defaultVenueMapUrl?.length ?? 0) > 2048
  ) return { ok: false, error: "text" };

  return {
    ok: true,
    value: {
      clubIntroduction: values.clubIntroduction,
      nameStory: values.nameStory,
      objectives: values.objectives,
      contactPhone: values.contactPhone,
      defaultVenueName: values.defaultVenueName,
      defaultVenueAddress: values.defaultVenueAddress,
      defaultVenueMapUrl: values.defaultVenueMapUrl,
      instagramUrl: values.instagramUrl,
      tiktokUrl: values.tiktokUrl,
      literaryPartnerTitle: values.literaryPartnerTitle,
      literaryPartnerBody: values.literaryPartnerBody,
    },
  };
}
