import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventCapacityTable } from "@/features/admin/components/EventCapacityTable";
import type { Event } from "@/lib/domain/types";

const event: Event = { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", title: "لقاء", kind: "club_event", audience: "adults", eventTypeLabel: "قراءة", startsAt: "2026-08-10T15:00:00.000Z", endsAt: "2026-08-10T17:00:00.000Z", capacity: 20, activeReservationCount: 4, priceHalalas: 7500, posterUrl: null, registrationStatus: "open", availability: "available", publicationStatus: "draft", createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" };

describe("EventCapacityTable", () => {
  it("renders an empty state without demo rows", () => {
    render(<EventCapacityTable events={[]} />);
    expect(screen.getByRole("heading", { name: "لا توجد فعاليات بعد" })).toBeInTheDocument();
  });

  it("shows derived availability and opens the event workspace", () => {
    render(<EventCapacityTable events={[event]} statusAction={vi.fn()} />);
    expect(screen.getByText("متاح")).toBeInTheDocument();
    expect(screen.getByText("مفتوح")).toBeInTheDocument();
    expect(screen.getByText("٤ / ٢٠")).toBeInTheDocument();
    expect(screen.getByText("مسودة")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "إدارة الفعالية" })).toHaveAttribute("href", `/admin/events/${event.id}`);
    fireEvent.click(screen.getByText("تغيير الحالة"));
    expect(screen.getByRole("button", { name: "نشر الفعالية" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "أرشفة الفعالية" })).toBeInTheDocument();
  });

  it("keeps cancellation behind an explicit confirmation", () => {
    render(
      <EventCapacityTable
        events={[{ ...event, publicationStatus: "published" }]}
        statusAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("تغيير الحالة"));
    fireEvent.click(screen.getByRole("button", { name: "إلغاء الفعالية" }));
    expect(screen.getByRole("form", { name: "تأكيد إلغاء الفعالية" })).toBeInTheDocument();
    expect(screen.getByText(/ستتوقف التسجيلات/)).toBeInTheDocument();
  });
});
