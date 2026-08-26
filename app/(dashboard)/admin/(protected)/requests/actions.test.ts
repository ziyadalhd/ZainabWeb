import { beforeEach, describe, expect, it, vi } from "vitest";
import { idleActionResult } from "@/lib/data/action-result";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  revalidatePath: vi.fn(),
  markContacted: vi.fn(),
}));

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/service-requests", () => ({
  createAdminServiceRequestRepository: vi.fn(async () => ({ markContacted: mocks.markContacted })),
}));

import { markServiceRequestContactedAction } from "@/app/(dashboard)/admin/(protected)/requests/actions";

const validId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "admin" });
});

describe("markServiceRequestContactedAction", () => {
  it("requires an administrator before mutating a request", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new Error("unauthorized"));

    await expect(markServiceRequestContactedAction(validId, idleActionResult, new FormData())).rejects.toThrow("unauthorized");
    expect(mocks.markContacted).not.toHaveBeenCalled();
  });

  it("rejects a malformed request id before touching the repository (admin overhaul plan A12)", async () => {
    const result = await markServiceRequestContactedAction("not-a-uuid", idleActionResult, new FormData());
    expect(result).toEqual({ status: "error", message: "معرف الطلب غير صالح." });
    expect(mocks.markContacted).not.toHaveBeenCalled();
  });

  it("marks the request contacted and revalidates the admin views", async () => {
    const result = await markServiceRequestContactedAction(validId, idleActionResult, new FormData());

    expect(result).toEqual({ status: "success" });
    expect(mocks.markContacted).toHaveBeenCalledWith(validId);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/requests");
  });

  it("surfaces a repository failure as an error result instead of swallowing it (fixes A9/S4)", async () => {
    mocks.markContacted.mockRejectedValueOnce(new Error("db down"));

    const result = await markServiceRequestContactedAction(validId, idleActionResult, new FormData());
    expect(result).toEqual({ status: "error" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
