import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  saveRegistrationReminderTemplate: vi.fn(),
}));

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/message-templates", () => ({
  saveRegistrationReminderTemplate: mocks.saveRegistrationReminderTemplate,
}));

import { saveEventReminderTemplateAction, saveGlobalReminderTemplateAction } from "@/app/(dashboard)/admin/(protected)/messages/templates/actions";

const validEventId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const validBody = "مرحبًا {{attendee_name}}، فعالية {{event_title}} — {{management_url}}";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "admin" });
});

describe("saveGlobalReminderTemplateAction", () => {
  it("rejects a body missing a required token", async () => {
    const formData = new FormData();
    formData.set("body", "بلا متغيرات");

    await expect(saveGlobalReminderTemplateAction(formData)).rejects.toThrow("REDIRECT:/admin/settings?tab=templates&error=validation");
    expect(mocks.saveRegistrationReminderTemplate).not.toHaveBeenCalled();
  });

  it("redirects with a save error when persistence throws", async () => {
    mocks.saveRegistrationReminderTemplate.mockRejectedValueOnce(new Error("db down"));
    const formData = new FormData();
    formData.set("body", validBody);

    await expect(saveGlobalReminderTemplateAction(formData)).rejects.toThrow("REDIRECT:/admin/settings?tab=templates&error=save");
  });

  it("saves the global template and redirects with success", async () => {
    const formData = new FormData();
    formData.set("body", validBody);

    await expect(saveGlobalReminderTemplateAction(formData)).rejects.toThrow("REDIRECT:/admin/settings?tab=templates&success=saved");
    expect(mocks.saveRegistrationReminderTemplate).toHaveBeenCalledWith(validBody);
  });
});

describe("saveEventReminderTemplateAction", () => {
  it("rejects a malformed event id before validating the body", async () => {
    const formData = new FormData();
    formData.set("body", validBody);

    await expect(saveEventReminderTemplateAction("not-a-uuid", formData)).rejects.toThrow(
      "REDIRECT:/admin/events/not-a-uuid?tab=communications&error=template",
    );
    expect(mocks.saveRegistrationReminderTemplate).not.toHaveBeenCalled();
  });

  it("saves a per-event override and redirects with success", async () => {
    const formData = new FormData();
    formData.set("body", validBody);

    await expect(saveEventReminderTemplateAction(validEventId, formData)).rejects.toThrow(
      `REDIRECT:/admin/events/${validEventId}?tab=communications&success=template`,
    );
    expect(mocks.saveRegistrationReminderTemplate).toHaveBeenCalledWith(validBody, validEventId);
  });
});
