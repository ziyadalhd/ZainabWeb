import { beforeEach, describe, expect, it, vi } from "vitest";
import { idleActionResult } from "@/lib/data/action-result";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  revalidatePath: vi.fn(),
  cancel: vi.fn(),
  revokeInvitation: vi.fn(),
  confirmInvitation: vi.fn(),
  confirmAttendance: vi.fn(),
  recordCheckIn: vi.fn(),
  setPaymentStatus: vi.fn(),
}));

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/registrations", () => ({
  createAdminRegistrationRepository: vi.fn(async () => ({
    cancel: mocks.cancel,
    revokeInvitation: mocks.revokeInvitation,
    confirmInvitation: mocks.confirmInvitation,
    confirmAttendance: mocks.confirmAttendance,
    recordCheckIn: mocks.recordCheckIn,
    setPaymentStatus: mocks.setPaymentStatus,
  })),
}));

import {
  cancelRegistrationAction,
  confirmAttendanceAction,
  confirmInvitationAction,
  recordCheckInAction,
  revokeInvitationAction,
  setRegistrationPaymentStatusAction,
} from "@/app/(dashboard)/admin/(protected)/registrations/actions";

const validId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "admin" });
});

describe("cancelRegistrationAction", () => {
  it("requires an administrator before mutating a registration", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new Error("unauthorized"));

    await expect(cancelRegistrationAction(validId, idleActionResult, new FormData())).rejects.toThrow("unauthorized");
    expect(mocks.cancel).not.toHaveBeenCalled();
  });

  it("rejects a malformed id before touching the repository", async () => {
    const result = await cancelRegistrationAction("not-a-uuid", idleActionResult, new FormData());
    expect(result).toEqual({ status: "error", message: "معرف التسجيل غير صالح." });
    expect(mocks.cancel).not.toHaveBeenCalled();
  });

  it("returns an error result when the repository throws", async () => {
    mocks.cancel.mockRejectedValueOnce(new Error("db down"));

    const result = await cancelRegistrationAction(validId, idleActionResult, new FormData());
    expect(result).toEqual({ status: "error" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("cancels, revalidates the registration views, and returns success without navigating", async () => {
    const result = await cancelRegistrationAction(validId, idleActionResult, new FormData());

    expect(result).toEqual({ status: "success" });
    expect(mocks.cancel).toHaveBeenCalledWith(validId);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/registrations");
  });
});

describe("revokeInvitationAction", () => {
  it("revokes and returns success", async () => {
    const result = await revokeInvitationAction(validId, idleActionResult, new FormData());
    expect(result).toEqual({ status: "success" });
    expect(mocks.revokeInvitation).toHaveBeenCalledWith(validId);
  });
});

describe("confirmAttendanceAction", () => {
  it("confirms and returns success", async () => {
    const result = await confirmAttendanceAction(validId, idleActionResult, new FormData());
    expect(result).toEqual({ status: "success" });
    expect(mocks.confirmAttendance).toHaveBeenCalledWith(validId);
  });
});

describe("confirmInvitationAction", () => {
  it("confirms the invitation on the guest's behalf and returns success", async () => {
    const result = await confirmInvitationAction(validId, idleActionResult, new FormData());
    expect(result).toEqual({ status: "success" });
    expect(mocks.confirmInvitation).toHaveBeenCalledWith(validId);
  });

  it("returns an error result when the repository rejects (e.g. the invitation already expired)", async () => {
    mocks.confirmInvitation.mockRejectedValueOnce(new Error("invitation_unavailable"));

    const result = await confirmInvitationAction(validId, idleActionResult, new FormData());
    expect(result).toEqual({ status: "error" });
  });
});

describe("recordCheckInAction", () => {
  it("rejects an outcome outside the allowed check-in states", async () => {
    const result = await recordCheckInAction(validId, "pending", idleActionResult, new FormData());
    expect(result.status).toBe("error");
    expect(mocks.recordCheckIn).not.toHaveBeenCalled();
  });

  it("rejects an unrecognised outcome value", async () => {
    const result = await recordCheckInAction(validId, "attended", idleActionResult, new FormData());
    expect(result.status).toBe("error");
    expect(mocks.recordCheckIn).not.toHaveBeenCalled();
  });

  it("records a valid outcome and returns success", async () => {
    const result = await recordCheckInAction(validId, "checked_in", idleActionResult, new FormData());
    expect(result).toEqual({ status: "success" });
    expect(mocks.recordCheckIn).toHaveBeenCalledWith(validId, "checked_in");
  });
});

describe("setRegistrationPaymentStatusAction", () => {
  function formDataWith(status: string) {
    const formData = new FormData();
    formData.set("paymentStatus", status);
    return formData;
  }

  it("rejects an invalid payment status without calling the repository", async () => {
    const result = await setRegistrationPaymentStatusAction(validId, {}, formDataWith("refunded"));
    expect(result).toEqual({ error: "status" });
    expect(mocks.setPaymentStatus).not.toHaveBeenCalled();
  });

  it("returns a save error when the repository throws", async () => {
    mocks.setPaymentStatus.mockRejectedValueOnce(new Error("db down"));

    const result = await setRegistrationPaymentStatusAction(validId, {}, formDataWith("paid_in_full"));
    expect(result).toEqual({ error: "save" });
  });

  it("saves the payment status without navigating away", async () => {
    const result = await setRegistrationPaymentStatusAction(validId, {}, formDataWith("paid_in_full"));

    expect(result).toEqual({ saved: true });
    expect(mocks.setPaymentStatus).toHaveBeenCalledWith(validId, "paid_in_full");
  });
});
