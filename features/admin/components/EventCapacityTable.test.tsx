import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventCapacityTable } from "@/features/admin/components/EventCapacityTable";
import type { Event } from "@/lib/domain/types";

vi.mock("@/app/(dashboard)/admin/(protected)/events/actions", () => ({ changeEventStatusAction: vi.fn() }));

const event: Event = { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", title: "لقاء", audience: "adults", eventTypeLabel: "قراءة", startsAt: "2026-08-10T15:00:00.000Z", capacity: 20, availability: "available", publicationStatus: "draft", createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" };

describe("EventCapacityTable", () => {
  it("renders an empty state without demo rows", () => {
    render(<EventCapacityTable events={[]} />);
    expect(screen.getByRole("heading", { name: "لا توجد فعاليات بعد" })).toBeInTheDocument();
  });

  it("shows manual availability, publication status and draft actions", () => {
    render(<EventCapacityTable events={[event]} />);
    expect(screen.getByText("متاح")).toBeInTheDocument();
    expect(screen.getByText("مسودة")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "نشر" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "تعديل" })).toHaveAttribute("href", `/admin/events/${event.id}/edit`);
  });
});
