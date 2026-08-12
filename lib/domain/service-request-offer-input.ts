import { parsePriceSarToHalalas, riyadhDateTimeLocalToIso } from "@/lib/domain/event-input";

export type ServiceRequestOfferInputError = "price" | "terms" | "expiresAt";

export type ServiceRequestOfferInput = {
  priceHalalas: number;
  terms: string;
  expiresAt: string | null;
};

export type ServiceRequestOfferInputResult =
  | { ok: true; value: ServiceRequestOfferInput }
  | { ok: false; error: ServiceRequestOfferInputError };

export function validateServiceRequestOfferInput(formData: FormData): ServiceRequestOfferInputResult {
  const priceHalalas = parsePriceSarToHalalas(String(formData.get("priceSar") ?? ""));
  if (priceHalalas === null) return { ok: false, error: "price" };

  const terms = String(formData.get("terms") ?? "").trim();
  if (terms.length < 1 || terms.length > 4000) return { ok: false, error: "terms" };

  const expiresAtInput = String(formData.get("expiresAt") ?? "").trim();
  const expiresAt = expiresAtInput ? riyadhDateTimeLocalToIso(expiresAtInput) : null;
  if (expiresAtInput && (!expiresAt || new Date(expiresAt) <= new Date())) {
    return { ok: false, error: "expiresAt" };
  }

  return { ok: true, value: { priceHalalas, terms, expiresAt } };
}
