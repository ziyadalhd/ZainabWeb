import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  revalidatePath: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/site-settings", () => ({
  createAdminSiteSettingsRepository: vi.fn(async () => ({ update: mocks.update })),
}));

import { updateSiteSettingsAction } from "@/app/(dashboard)/admin/(protected)/content/actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "admin" });
});

describe("updateSiteSettingsAction", () => {
  it("requires an administrator before validating input", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new Error("unauthorized"));

    await expect(updateSiteSettingsAction({}, new FormData())).rejects.toThrow("unauthorized");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects an invalid phone number without saving", async () => {
    const formData = new FormData();
    formData.set("contactPhone", "12345");

    const result = await updateSiteSettingsAction({}, formData);

    expect(result).toEqual({ error: "phone" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects a non-http(s) URL", async () => {
    const formData = new FormData();
    formData.set("instagramUrl", "javascript:alert(1)");

    const result = await updateSiteSettingsAction({}, formData);

    expect(result).toEqual({ error: "url" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns a save error when the repository throws", async () => {
    mocks.update.mockRejectedValueOnce(new Error("db down"));

    const result = await updateSiteSettingsAction({}, new FormData());

    expect(result).toEqual({ error: "save" });
  });

  it("saves and revalidates every page that surfaces site settings", async () => {
    const result = await updateSiteSettingsAction({}, new FormData());

    expect(result).toEqual({ saved: true });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/contact");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/literary-partner");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/content");
  });
});
