import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventSettingsSection } from "@/features/admin/components/EventSettingsSection";
import { ToastProvider } from "@/components/ui/ToastProvider";
import type { Event } from "@/lib/domain/types";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

const mocks = vi.hoisted(() => ({
  updateEventAction: vi.fn(async () => ({ status: "success" as const, eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" })),
  uploadEventPosterAction: vi.fn(async () => ({})),
  deleteEventAction: vi.fn(async () => ({ status: "success" as const })),
}));

vi.mock("@/app/(dashboard)/admin/(protected)/events/actions", () => ({
  updateEventAction: mocks.updateEventAction,
  uploadEventPosterAction: mocks.uploadEventPosterAction,
  deleteEventAction: mocks.deleteEventAction,
}));

const event: Event = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  title: "لقاء القراءة",
  kind: "club_event",
  audience: "adults",
  eventTypeLabel: "قراءة",
  startsAt: "2026-08-25T15:00:00.000Z",
  endsAt: "2026-08-25T17:00:00.000Z",
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

function renderSection() {
  return render(
    <ToastProvider>
      <EventSettingsSection event={event} statusAction={vi.fn(async () => ({ status: "success" as const }))} />
    </ToastProvider>,
  );
}

describe("EventSettingsSection", () => {
  it("shows the publication controls in view mode, without a form", () => {
    renderSection();

    expect(screen.getByRole("button", { name: "تعديل الإعدادات" })).toBeInTheDocument();
    expect(screen.getByText("حالة النشر")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "عنوان الفعالية" })).not.toBeInTheDocument();
  });

  it("switches to an inline edit form without navigating away, and returns to the summary after a successful save", async () => {
    refresh.mockClear();
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "تعديل الإعدادات" }));
    expect(screen.getByRole("textbox", { name: "عنوان الفعالية" })).toHaveValue(event.title);

    fireEvent.click(screen.getByRole("button", { name: "حفظ التعديلات" }));

    await screen.findByRole("button", { name: "تعديل الإعدادات" });
    expect(screen.queryByRole("textbox", { name: "عنوان الفعالية" })).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("offers deletion from a separate danger zone that points at cancellation for live events", () => {
    renderSection();

    expect(screen.getByText("منطقة الحذف")).toBeInTheDocument();
    expect(screen.getByText(/الحذف نهائي ولا يمكن التراجع عنه/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "حذف الفعالية" })).toBeInTheDocument();
  });

  it("does not delete when the danger-zone trigger is clicked — it only opens the confirmation", () => {
    mocks.deleteEventAction.mockClear();
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "حذف الفعالية" }));

    expect(mocks.deleteEventAction).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
