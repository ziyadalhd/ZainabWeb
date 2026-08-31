import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventStatusControl } from "@/features/admin/components/EventStatusControl";
import { ToastProvider } from "@/components/ui/ToastProvider";
import type { Event } from "@/lib/domain/types";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const event: Event = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
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

function renderControl(action: React.ComponentProps<typeof EventStatusControl>["action"], override: Partial<Event> = {}) {
  return render(
    <ToastProvider>
      <EventStatusControl event={{ ...event, ...override }} action={action} />
    </ToastProvider>,
  );
}

describe("EventStatusControl", () => {
  it("swaps to the published transitions while the action is still in flight, with no pending label left behind", async () => {
    let resolveAction: (result: { status: "success" }) => void = () => undefined;
    const action = vi.fn(() => new Promise<{ status: "success" }>((resolve) => (resolveAction = resolve)));

    renderControl(action);
    fireEvent.click(screen.getByRole("button", { name: "نشر" }));

    // The optimistic status lands in the same frame: publish is gone, the published-state
    // transitions are already offered, and nothing reads "جارٍ التنفيذ…".
    await waitFor(() => expect(screen.getByRole("button", { name: "إلغاء" })).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "نشر" })).not.toBeInTheDocument();
    expect(screen.queryByText("جارٍ التنفيذ…")).not.toBeInTheDocument();
    expect(action).toHaveBeenCalledWith(event.id, "published", { status: "idle" }, expect.any(FormData));

    await act(async () => resolveAction({ status: "success" }));
    expect(await screen.findByText("تم نشر الفعالية.")).toBeInTheDocument();
  });

  it("rolls the status back and reports the server's reason when the action fails", async () => {
    const action = vi.fn(async () => ({ status: "error" as const, message: "أكملي وقت النهاية." }));
    renderControl(action);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "نشر" }));
    });

    expect(await screen.findByText("أكملي وقت النهاية.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "نشر" })).toBeInTheDocument();
  });

  it("keeps a destructive transition behind an inline confirmation", async () => {
    const action = vi.fn(async () => ({ status: "success" as const }));
    renderControl(action, { publicationStatus: "published" });

    fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));
    expect(screen.getByRole("group", { name: "تأكيد إلغاء" })).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "تأكيد إلغاء" }));
    });
    expect(action).toHaveBeenCalledWith(event.id, "cancelled", { status: "idle" }, expect.any(FormData));
  });

  it("routes an incomplete draft to the edit form instead of offering a publish that would fail", () => {
    renderControl(vi.fn(async () => ({ status: "success" as const })), { priceHalalas: null });
    expect(screen.getByRole("link", { name: "أكملي البيانات للنشر" })).toHaveAttribute("href", `/admin/events/${event.id}/edit`);
    expect(screen.queryByRole("button", { name: "نشر" })).not.toBeInTheDocument();
  });
});
