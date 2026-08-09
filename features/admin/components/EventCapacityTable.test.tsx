import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventCapacityTable } from "@/features/admin/components/EventCapacityTable";
import type { Event } from "@/lib/domain/types";

vi.mock("@/app/(dashboard)/admin/(protected)/events/actions", () => ({ changeEventStatusAction: vi.fn() }));

const event: Event = { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", title: "لقاء", audience: "adults", eventTypeLabel: "قراءة", startsAt: "2026-08-10T15:00:00.000Z", endsAt: "2026-08-10T17:00:00.000Z", capacity: 20, activeReservationCount: 4, priceHalalas: 7500, registrationStatus: "open", availability: "available", publicationStatus: "draft", createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" };

describe("EventCapacityTable", () => {
  it("renders an empty state without demo rows", () => {
    render(<EventCapacityTable events={[]} />);
    expect(screen.getByRole("heading", { name: "لا توجد فعاليات بعد" })).toBeInTheDocument();
  });

  it("shows derived availability, registration control and draft actions", () => {
    render(<EventCapacityTable events={[event]} />);
    expect(screen.getByText("متاح")).toBeInTheDocument();
    expect(screen.getByText("مفتوح")).toBeInTheDocument();
    expect(screen.getByText("٤ / ٢٠")).toBeInTheDocument();
    expect(screen.getByText("مسودة")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "نشر" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "تعديل" })).toHaveAttribute("href", `/admin/events/${event.id}/edit`);
  });
});
