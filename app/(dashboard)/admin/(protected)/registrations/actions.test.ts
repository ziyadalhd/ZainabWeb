import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  cancel: vi.fn(),
  revokeInvitation: vi.fn(),
  confirmAttendance: vi.fn(),
  recordCheckIn: vi.fn(),
  setPaymentStatus: vi.fn(),
}));

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/registrations", () => ({
  createAdminRegistrationRepository: vi.fn(async () => ({
    cancel: mocks.cancel,
    revokeInvitation: mocks.revokeInvitation,
    confirmAttendance: mocks.confirmAttendance,
    recordCheckIn: mocks.recordCheckIn,
    setPaymentStatus: mocks.setPaymentStatus,
  })),
}));

import {
  cancelRegistrationAction,
  cancelWaitlistedRegistrationAction,
  confirmAttendanceAction,
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

    await expect(cancelRegistrationAction(validId)).rejects.toThrow("unauthorized");
    expect(mocks.cancel).not.toHaveBeenCalled();
  });

  it("rejects a malformed id before touching the repository", async () => {
    await expect(cancelRegistrationAction("not-a-uuid")).rejects.toThrow("REDIRECT:/admin/registrations?view=upcoming&error=invalid");
    expect(mocks.cancel).not.toHaveBeenCalled();
  });

  it("redirects with an error code when the repository throws", async () => {
    mocks.cancel.mockRejectedValueOnce(new Error("db down"));

    await expect(cancelRegistrationAction(validId)).rejects.toThrow("REDIRECT:/admin/registrations?view=upcoming&error=cancel");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("cancels, revalidates every registration view, and redirects with success", async () => {
    await expect(cancelRegistrationAction(validId)).rejects.toThrow("REDIRECT:/admin/registrations?view=upcoming&success=cancel");

    expect(mocks.cancel).toHaveBeenCalledWith(validId);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/registrations");
  });
});

describe("cancelWaitlistedRegistrationAction", () => {
  it("targets the waitlist view on success", async () => {
    await expect(cancelWaitlistedRegistrationAction(validId)).rejects.toThrow("REDIRECT:/admin/registrations?view=waitlist&success=cancel");
    expect(mocks.cancel).toHaveBeenCalledWith(validId);
  });
});

describe("revokeInvitationAction", () => {
  it("revokes and redirects to the waitlist view", async () => {
    await expect(revokeInvitationAction(validId)).rejects.toThrow("REDIRECT:/admin/registrations?view=waitlist&success=revoke");
    expect(mocks.revokeInvitation).toHaveBeenCalledWith(validId);
  });
});

describe("confirmAttendanceAction", () => {
  it("confirms and redirects to the upcoming view", async () => {
    await expect(confirmAttendanceAction(validId)).rejects.toThrow("REDIRECT:/admin/registrations?view=upcoming&success=confirm");
    expect(mocks.confirmAttendance).toHaveBeenCalledWith(validId);
  });
});

describe("recordCheckInAction", () => {
  it("rejects an outcome outside the allowed check-in states", async () => {
    await expect(recordCheckInAction(validId, "pending")).rejects.toThrow("REDIRECT:/admin/registrations?view=upcoming&error=check-in");
    expect(mocks.recordCheckIn).not.toHaveBeenCalled();
  });

  it("rejects an unrecognised outcome value", async () => {
    await expect(recordCheckInAction(validId, "attended")).rejects.toThrow("REDIRECT:/admin/registrations?view=upcoming&error=check-in");
    expect(mocks.recordCheckIn).not.toHaveBeenCalled();
  });

  it("records a valid outcome and redirects with success", async () => {
    await expect(recordCheckInAction(validId, "checked_in")).rejects.toThrow("REDIRECT:/admin/registrations?view=upcoming&success=check-in");
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
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
