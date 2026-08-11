import { describe, expect, it } from "vitest";
import { validateServiceRequestOfferInput } from "@/lib/domain/service-request-offer-input";

function offerForm(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

describe("service request offer input", () => {
  it("normalizes the price and Riyadh expiry into a safe server value", () => {
    const result = validateServiceRequestOfferInput(offerForm({
      priceSar: "١٥٠.٥",
      terms: "يشمل استخدام المساحة خلال الوقت المتفق عليه.",
      expiresAt: "2030-08-11T18:30",
    }));

    expect(result).toEqual({
      ok: true,
      value: {
        priceHalalas: 15050,
        terms: "يشمل استخدام المساحة خلال الوقت المتفق عليه.",
        expiresAt: "2030-08-11T15:30:00.000Z",
      },
    });
  });

  it("rejects missing terms and an expiry that has already passed", () => {
    expect(validateServiceRequestOfferInput(offerForm({ priceSar: "0", terms: "", expiresAt: "" }))).toEqual({ ok: false, error: "terms" });
    expect(validateServiceRequestOfferInput(offerForm({ priceSar: "0", terms: "عرض", expiresAt: "2020-01-01T10:00" }))).toEqual({ ok: false, error: "expiresAt" });
  });
});
