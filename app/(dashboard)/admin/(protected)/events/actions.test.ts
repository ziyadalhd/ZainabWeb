import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Event } from "@/lib/domain/types";
import { idleActionResult } from "@/lib/data/action-result";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  revalidatePath: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  duplicate: vi.fn(),
  get: vi.fn(),
  changeStatus: vi.fn(),
  setPosterPath: vi.fn(),
  deleteEvent: vi.fn(),
  removePoster: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/events", () => ({
  createAdminEventRepository: vi.fn(async () => ({
    create: mocks.create,
    update: mocks.update,
    duplicate: mocks.duplicate,
    get: mocks.get,
    changeStatus: mocks.changeStatus,
    setPosterPath: mocks.setPosterPath,
    delete: mocks.deleteEvent,
  })),
}));
vi.mock("@/lib/supabase/event-posters", () => ({
  SupabaseEventPosterStorage: class {
    remove = mocks.removePoster;
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import {
  changeEventStatusAction,
  createEventAction,
  deleteEventAction,
  duplicateEventAction,
  updateEventAction,
  uploadEventPosterAction,
} from "@/app/(dashboard)/admin/(protected)/events/actions";

const validId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const baseEvent: Event = {
  id: validId,
  title: "لقاء",
  kind: "club_event",
  audience: "adults",
  eventTypeLabel: "قراءة",
  startsAt: "2026-08-10T15:00:00.000Z",
  endsAt: "2026-08-10T17:00:00.000Z",
  capacity: 20,
  activeReservationCount: 4,
  priceHalalas: 7500,
  posterUrl: null,
  registrationStatus: "open",
  availability: "available",
  publicationStatus: "draft",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

function validEventFormData(): FormData {
  const formData = new FormData();
  formData.set("title", "لقاء القراءة");
  formData.set("audience", "adults");
  formData.set("kind", "club_event");
  formData.set("eventTypeLabel", "قراءة");
  formData.set("startDate", "2026-09-01");
  formData.set("startTime", "18:00");
  formData.set("endDate", "2026-09-01");
  formData.set("endTime", "20:00");
  formData.set("capacity", "20");
  formData.set("priceSar", "75");
  formData.set("registrationStatus", "open");
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "admin" });
  mocks.create.mockResolvedValue(baseEvent);
});

describe("createEventAction", () => {
  it("requires an administrator before validating input", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new Error("unauthorized"));

    await expect(createEventAction({ status: "idle" }, validEventFormData())).rejects.toThrow("unauthorized");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns a field-specific error without calling the repository", async () => {
    const formData = validEventFormData();
    formData.set("title", "");

    const result = await createEventAction({ status: "idle" }, formData);

    expect(result).toEqual({ status: "error", errors: ["title"] });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns a save error when the repository throws", async () => {
    mocks.create.mockRejectedValueOnce(new Error("db down"));

    const result = await createEventAction({ status: "idle" }, validEventFormData());

    expect(result).toEqual({ status: "error", errors: ["save"] });
  });

  it("reports every failing field in one round trip instead of only the first", async () => {
    const formData = validEventFormData();
    formData.set("title", "");
    formData.set("capacity", "0");

    const result = await createEventAction({ status: "idle" }, formData);

    expect(result).toEqual({ status: "error", errors: ["title", "capacity"] });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("creates the event as a draft and returns a typed success result without redirecting", async () => {
    const result = await createEventAction({ status: "idle" }, validEventFormData());

    expect(result).toEqual({ status: "success", eventId: baseEvent.id });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ title: "لقاء القراءة" }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/events");
  });
});

describe("updateEventAction", () => {
  it("rejects a malformed event id before validating input (admin overhaul plan A12)", async () => {
    const result = await updateEventAction("not-a-uuid", { status: "idle" }, validEventFormData());
    expect(result).toEqual({ status: "error", errors: ["save"] });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns a field-specific error without calling the repository", async () => {
    const formData = validEventFormData();
    formData.set("capacity", "0");

    const result = await updateEventAction(validId, { status: "idle" }, formData);

    expect(result).toEqual({ status: "error", errors: ["capacity"] });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("saves and returns a typed success result without redirecting", async () => {
    const result = await updateEventAction(validId, { status: "idle" }, validEventFormData());

    expect(result).toEqual({ status: "success", eventId: validId });
    expect(mocks.update).toHaveBeenCalledWith(validId, expect.objectContaining({ title: "لقاء القراءة" }));
  });
});

describe("changeEventStatusAction", () => {
  it("rejects a malformed event id", async () => {
    const result = await changeEventStatusAction("not-a-uuid", "published", idleActionResult, new FormData());
    expect(result.status).toBe("error");
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("rejects a status value outside the known publication states", async () => {
    // @ts-expect-error intentionally invalid to characterise the guard
    const result = await changeEventStatusAction(validId, "deleted", idleActionResult, new FormData());
    expect(result.status).toBe("error");
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("rejects a transition the domain rules do not allow", async () => {
    mocks.get.mockResolvedValueOnce({ ...baseEvent, publicationStatus: "cancelled" });

    const result = await changeEventStatusAction(validId, "published", idleActionResult, new FormData());
    expect(result.status).toBe("error");
    expect(mocks.changeStatus).not.toHaveBeenCalled();
  });

  it("blocks publishing a draft missing the end time or price", async () => {
    mocks.get.mockResolvedValueOnce({ ...baseEvent, publicationStatus: "draft", endsAt: null });

    const result = await changeEventStatusAction(validId, "published", idleActionResult, new FormData());
    expect(result).toEqual({ status: "error", message: "أكمل وقت النهاية والسعر في صفحة التعديل قبل نشر الفعالية." });
    expect(mocks.changeStatus).not.toHaveBeenCalled();
  });

  it("changes status and returns a typed success result without redirecting, keeping the operator in place", async () => {
    mocks.get.mockResolvedValueOnce(baseEvent);

    const result = await changeEventStatusAction(validId, "published", idleActionResult, new FormData());
    expect(result).toEqual({ status: "success" });
    expect(mocks.changeStatus).toHaveBeenCalledWith(validId, "published");
  });
});

describe("duplicateEventAction", () => {
  it("requires an administrator before touching the repository", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new Error("unauthorized"));

    await expect(duplicateEventAction(validId, { status: "idle" }, new FormData())).rejects.toThrow("unauthorized");
    expect(mocks.duplicate).not.toHaveBeenCalled();
  });

  it("rejects a malformed event id", async () => {
    const result = await duplicateEventAction("not-a-uuid", { status: "idle" }, new FormData());
    expect(result).toEqual({ status: "error" });
    expect(mocks.duplicate).not.toHaveBeenCalled();
  });

  it("returns a save error when the repository throws", async () => {
    mocks.duplicate.mockRejectedValueOnce(new Error("db down"));

    const result = await duplicateEventAction(validId, { status: "idle" }, new FormData());

    expect(result).toEqual({ status: "error" });
  });

  it("duplicates the event and returns the new draft's id", async () => {
    mocks.duplicate.mockResolvedValueOnce({ ...baseEvent, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" });

    const result = await duplicateEventAction(validId, { status: "idle" }, new FormData());

    expect(result).toEqual({ status: "success", eventId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" });
    expect(mocks.duplicate).toHaveBeenCalledWith(validId);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/events");
  });
});

describe("uploadEventPosterAction", () => {
  it("rejects a malformed event id before validating the file", async () => {
    const result = await uploadEventPosterAction("not-a-uuid", {}, new FormData());
    expect(result).toEqual({ error: "save" });
  });

  it("rejects a missing poster file", async () => {
    const result = await uploadEventPosterAction(validId, {}, new FormData());
    expect(result).toEqual({ error: "file" });
  });
});

describe("deleteEventAction", () => {
  beforeEach(() => {
    mocks.removePoster.mockResolvedValue(undefined);
    mocks.createSupabaseServerClient.mockResolvedValue({});
  });

  it("requires an admin session before touching the repository", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(new Error("NEXT_REDIRECT"));

    await expect(deleteEventAction(validId, idleActionResult, new FormData())).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.deleteEvent).not.toHaveBeenCalled();
  });

  it("rejects a malformed event id without calling the repository", async () => {
    const result = await deleteEventAction("not-a-uuid", idleActionResult, new FormData());

    expect(result.status).toBe("error");
    expect(mocks.deleteEvent).not.toHaveBeenCalled();
  });

  it("deletes the event, removes its poster and revalidates the event views", async () => {
    mocks.deleteEvent.mockResolvedValueOnce({ deleted: true, posterPath: `${validId}/poster.png` });

    const result = await deleteEventAction(validId, idleActionResult, new FormData());

    expect(result).toEqual({ status: "success" });
    expect(mocks.deleteEvent).toHaveBeenCalledWith(validId);
    expect(mocks.removePoster).toHaveBeenCalledWith(`${validId}/poster.png`);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/events");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/events");
  });

  it("skips storage cleanup when the event had no poster", async () => {
    mocks.deleteEvent.mockResolvedValueOnce({ deleted: true, posterPath: null });

    const result = await deleteEventAction(validId, idleActionResult, new FormData());

    expect(result).toEqual({ status: "success" });
    expect(mocks.removePoster).not.toHaveBeenCalled();
  });

  it("still reports success when the row is gone but the poster cleanup fails", async () => {
    mocks.deleteEvent.mockResolvedValueOnce({ deleted: true, posterPath: `${validId}/poster.png` });
    mocks.removePoster.mockRejectedValueOnce(new Error("storage down"));

    const result = await deleteEventAction(validId, idleActionResult, new FormData());

    expect(result).toEqual({ status: "success" });
  });

  it("refuses an event that has attendees and explains cancellation instead", async () => {
    mocks.deleteEvent.mockResolvedValueOnce({ deleted: false, reason: "has-attendees" });

    const result = await deleteEventAction(validId, idleActionResult, new FormData());

    expect(result.status).toBe("error");
    expect(result.message).toContain("تسجيلات");
    expect(mocks.removePoster).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("reports a missing event distinctly from a blocked one", async () => {
    mocks.deleteEvent.mockResolvedValueOnce({ deleted: false, reason: "not-found" });

    const result = await deleteEventAction(validId, idleActionResult, new FormData());

    expect(result.status).toBe("error");
    expect(result.message).toContain("لم نعثر");
  });

  it("returns a failure message and revalidates nothing when the repository throws", async () => {
    mocks.deleteEvent.mockRejectedValueOnce(new Error("db down"));

    const result = await deleteEventAction(validId, idleActionResult, new FormData());

    expect(result.status).toBe("error");
    expect(result.message).toContain("تعذر حذف الفعالية");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
