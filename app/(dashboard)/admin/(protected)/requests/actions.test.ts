import { beforeEach, describe, expect, it, vi } from "vitest";

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

    await expect(markServiceRequestContactedAction(validId)).rejects.toThrow("unauthorized");
    expect(mocks.markContacted).not.toHaveBeenCalled();
  });

  it("marks the request contacted and revalidates the admin views", async () => {
    await markServiceRequestContactedAction(validId);

    expect(mocks.markContacted).toHaveBeenCalledWith(validId);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/requests");
  });

  it("swallows a repository failure without surfacing any error to the caller (characterises A9/S4 — fix in Phase 3)", async () => {
    mocks.markContacted.mockRejectedValueOnce(new Error("db down"));

    await expect(markServiceRequestContactedAction(validId)).resolves.toBeUndefined();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
