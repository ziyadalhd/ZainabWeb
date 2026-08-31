import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventListCard } from "@/features/admin/components/EventListCard";
import { ToastProvider } from "@/components/ui/ToastProvider";
import type { Event } from "@/lib/domain/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const now = new Date("2026-08-05T12:00:00.000Z");

function renderCard(props: Partial<React.ComponentProps<typeof EventListCard>> & { event: Event }) {
  return render(
    <ToastProvider>
      <EventListCard
        now={now}
        statusAction={vi.fn(async () => ({ status: "success" as const }))}
        duplicateAction={vi.fn(async () => ({ status: "success" as const }))}
        deleteAction={vi.fn(async () => ({ status: "success" as const }))}
        {...props}
      />
    </ToastProvider>,
  );
}

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

describe("EventListCard", () => {
  it("shows the audience chip, lifecycle, capacity meter and manage link", () => {
    renderCard({ event });
    expect(screen.getByText("للبالغات")).toBeInTheDocument();
    expect(screen.getByText("مسودة")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "السعة ٤/٢٠" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "إدارة الفعالية" })).toHaveAttribute("href", `/admin/events?event=${event.id}`);
    expect(screen.getByRole("link", { name: "تعديل" })).toHaveAttribute("href", `/admin/events/${event.id}/edit`);
  });

  it("marks a published, already-started event as live", () => {
    renderCard({ event: { ...event, publicationStatus: "published", startsAt: "2026-08-05T10:00:00.000Z", endsAt: "2026-08-05T13:00:00.000Z" } });
    expect(screen.getByText("مباشرة الآن")).toBeInTheDocument();
  });

  it("offers publish and archive directly for a ready draft", () => {
    renderCard({ event: { ...event, endsAt: "2026-08-10T17:00:00.000Z", priceHalalas: 0 } });
    expect(screen.getByRole("button", { name: "نشر" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "أرشفة" })).toBeInTheDocument();
  });

  it("shows the duplicate action and hides the live check-in link for a far-future event", () => {
    renderCard({ event });
    expect(screen.getByRole("button", { name: "نسخ" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "وضع اليوم" })).not.toBeInTheDocument();
  });

  it("shows the live check-in link once the event has started", () => {
    renderCard({ event: { ...event, publicationStatus: "published", startsAt: "2026-08-05T10:00:00.000Z", endsAt: "2026-08-05T13:00:00.000Z" } });
    expect(screen.getByRole("link", { name: "وضع اليوم" })).toHaveAttribute("href", `/admin/events/${event.id}/live`);
  });

  it("shows the live check-in link for an upcoming event starting later today", () => {
    renderCard({ event: { ...event, publicationStatus: "published", startsAt: "2026-08-05T18:00:00.000Z", endsAt: "2026-08-05T20:00:00.000Z" } });
    expect(screen.getByRole("link", { name: "وضع اليوم" })).toBeInTheDocument();
  });

  it("keeps cancellation behind an explicit confirmation", () => {
    renderCard({ event: { ...event, publicationStatus: "published" } });
    fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));
    expect(screen.getByRole("group", { name: "تأكيد إلغاء" })).toBeInTheDocument();
    expect(screen.getByText(/ستتوقف التسجيلات/)).toBeInTheDocument();
  });
});
