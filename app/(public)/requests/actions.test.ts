import { describe, expect, it, vi } from "vitest";
import type { ServiceRequestInput, ServiceRequestReceipt } from "@/lib/domain/types";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  submit: vi.fn(),
  validateServiceRequestInput: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/domain/service-request-input", () => ({
  validateServiceRequestInput: mocks.validateServiceRequestInput,
}));
vi.mock("@/lib/supabase/service-requests", () => ({
  createServiceRequestService: vi.fn(async () => ({ submit: mocks.submit })),
}));

import { submitServiceRequestAction } from "@/app/(public)/requests/actions";

const workshopInput: ServiceRequestInput = {
  requesterName: "اختبار",
  phoneE164: "+966500000000",
  email: null,
  notes: null,
  booking: null,
  workshop: {
    title: "ورشة اختبار",
    description: "وصف اختبار",
    targetAudience: "كبار (فوق ١٨)",
    duration: "ساعة",
    expectedAttendance: 10,
    requirements: "لا يوجد",
    portfolioUrl: null,
  },
};

describe("submitServiceRequestAction", () => {
  it("submits a valid request without an external verification token", async () => {
    const formData = new FormData();
    const receipt: ServiceRequestReceipt = {
      reference: "REQ-TEST",
      managementToken: "token-not-used-by-action",
    };
    mocks.validateServiceRequestInput.mockReturnValue({ ok: true, value: workshopInput });
    mocks.submit.mockResolvedValue(receipt);

    await expect(
      submitServiceRequestAction("workshop_application", {}, formData),
    ).resolves.toEqual({ reference: receipt.reference });

    expect(mocks.validateServiceRequestInput).toHaveBeenCalledWith(formData, "workshop_application");
    expect(mocks.submit).toHaveBeenCalledWith("workshop_application", workshopInput);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/requests");
  });
});
