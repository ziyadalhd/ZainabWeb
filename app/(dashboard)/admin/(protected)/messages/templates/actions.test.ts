import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  revalidatePath: vi.fn(),
  saveMessageTemplate: vi.fn(),
  deleteEventMessageTemplate: vi.fn(),
}));

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/message-templates", () => ({
  saveMessageTemplate: mocks.saveMessageTemplate,
  deleteEventMessageTemplate: mocks.deleteEventMessageTemplate,
}));

import {
  resetEventMessageTemplateAction,
  saveMessageTemplateAction,
} from "@/app/(dashboard)/admin/(protected)/messages/templates/actions";
import { idleActionResult } from "@/lib/data/action-result";

const validEventId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function formData(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "admin" });
});

describe("saveMessageTemplateAction", () => {
  it("saves a global body when the required variables are present", async () => {
    const result = await saveMessageTemplateAction(
      idleActionResult,
      formData({ kind: "confirmation", body: "أهلًا {{attendee_name}} — {{management_url}}" }),
    );

    expect(result.status).toBe("success");
    expect(mocks.saveMessageTemplate).toHaveBeenCalledWith("confirmation", "أهلًا {{attendee_name}} — {{management_url}}", null);
  });

  it("scopes the save to one event when an event id is supplied", async () => {
    await saveMessageTemplateAction(
      idleActionResult,
      formData({ kind: "confirmation", body: "نص {{management_url}}", eventId: validEventId }),
    );

    expect(mocks.saveMessageTemplate).toHaveBeenCalledWith("confirmation", "نص {{management_url}}", validEventId);
  });

  it("names the missing variable in Arabic instead of saving", async () => {
    const result = await saveMessageTemplateAction(idleActionResult, formData({ kind: "confirmation", body: "نص بلا رابط" }));

    expect(result.status).toBe("error");
    expect(result.message).toContain("رابط الإدارة");
    expect(mocks.saveMessageTemplate).not.toHaveBeenCalled();
  });

  it("accepts a cancellation notice with no link, because it carries none", async () => {
    const result = await saveMessageTemplateAction(idleActionResult, formData({ kind: "cancellation", body: "نعتذر، أُلغيت الفعالية." }));

    expect(result.status).toBe("success");
  });

  it("rejects an empty body", async () => {
    const result = await saveMessageTemplateAction(idleActionResult, formData({ kind: "cancellation", body: "   " }));

    expect(result.status).toBe("error");
    expect(mocks.saveMessageTemplate).not.toHaveBeenCalled();
  });

  it("rejects a body longer than the column allows", async () => {
    const result = await saveMessageTemplateAction(idleActionResult, formData({ kind: "cancellation", body: "ا".repeat(2001) }));

    expect(result.status).toBe("error");
    expect(mocks.saveMessageTemplate).not.toHaveBeenCalled();
  });

  it("rejects an unknown message kind", async () => {
    const result = await saveMessageTemplateAction(idleActionResult, formData({ kind: "not_a_kind", body: "نص" }));

    expect(result.status).toBe("error");
    expect(mocks.saveMessageTemplate).not.toHaveBeenCalled();
  });

  it("rejects a malformed event id", async () => {
    const result = await saveMessageTemplateAction(
      idleActionResult,
      formData({ kind: "cancellation", body: "نص", eventId: "not-a-uuid" }),
    );

    expect(result.status).toBe("error");
    expect(mocks.saveMessageTemplate).not.toHaveBeenCalled();
  });

  it("reports a storage failure rather than claiming success", async () => {
    mocks.saveMessageTemplate.mockRejectedValueOnce(new Error("template_save_failed"));

    const result = await saveMessageTemplateAction(idleActionResult, formData({ kind: "cancellation", body: "نص" }));

    expect(result.status).toBe("error");
  });
});

describe("resetEventMessageTemplateAction", () => {
  it("drops the event override so the global text applies again", async () => {
    const result = await resetEventMessageTemplateAction(idleActionResult, formData({ kind: "confirmation", eventId: validEventId }));

    expect(result.status).toBe("success");
    expect(mocks.deleteEventMessageTemplate).toHaveBeenCalledWith("confirmation", validEventId);
  });

  it("refuses a malformed event id", async () => {
    const result = await resetEventMessageTemplateAction(idleActionResult, formData({ kind: "confirmation", eventId: "nope" }));

    expect(result.status).toBe("error");
    expect(mocks.deleteEventMessageTemplate).not.toHaveBeenCalled();
  });
});
