import { normalizeSaudiMobile } from "@/lib/domain/registration-input";
import type { InterestedContactInput } from "@/lib/domain/types";

export type InterestedContactInputErrorCode = "contactName" | "phone" | "email" | "consent" | "invalid";

export type InterestedContactInputResult =
  | { ok: true; value: InterestedContactInput }
  | { ok: false; error: InterestedContactInputErrorCode };

export function validateInterestedContactInput(formData: FormData): InterestedContactInputResult {
  const contactName = String(formData.get("contactName") ?? "").trim();
  if (contactName.length < 2 || contactName.length > 120) return { ok: false, error: "contactName" };

  const phoneE164 = normalizeSaudiMobile(String(formData.get("phone") ?? ""));
  if (!phoneE164) return { ok: false, error: "phone" };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || email.length > 254 || !email.includes("@")) return { ok: false, error: "email" };

  if (formData.get("upcomingEventsConsent") !== "on") return { ok: false, error: "consent" };

  return { ok: true, value: { contactName, phoneE164, email } };
}
