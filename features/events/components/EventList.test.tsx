import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventList } from "@/features/events/components/EventList";
import type { Event } from "@/lib/domain/types";

const events: readonly Event[] = [
  { id: "1", title: "لقاء للكبار", kind: "club_event", audience: "adults", eventTypeLabel: "لقاء", startsAt: "2026-08-10T15:00:00.000Z", endsAt: "2026-08-10T17:00:00.000Z", capacity: 30, activeReservationCount: 2, priceHalalas: 0, posterUrl: null, registrationStatus: "open", availability: "available", publicationStatus: "published", createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" },
  { id: "2", title: "ورشة لليافعين", kind: "club_event", audience: "youth", eventTypeLabel: "ورشة", startsAt: "2026-08-11T15:00:00.000Z", endsAt: "2026-08-11T17:00:00.000Z", capacity: 20, activeReservationCount: 20, priceHalalas: 7500, posterUrl: null, registrationStatus: "open", availability: "full", publicationStatus: "published", createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" },
  { id: "3", title: "قراءة للصغار", kind: "club_event", audience: "children", eventTypeLabel: "قراءة", startsAt: "2026-08-12T15:00:00.000Z", endsAt: null, capacity: 10, activeReservationCount: 0, priceHalalas: null, posterUrl: null, registrationStatus: "open", availability: "available", publicationStatus: "published", createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" },
];

describe("EventList", () => {
  it("renders the Arabic empty state", () => {
    render(<EventList events={[]} />);
    expect(screen.getByRole("heading", { name: "لا توجد فعاليات قادمة حاليًا" })).toBeInTheDocument();
  });

  it("renders event cards and all approved audience labels", () => {
    render(<EventList events={events} />);
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByText("الكبار")).toBeInTheDocument();
    expect(screen.getByText("اليافعون")).toBeInTheDocument();
    expect(screen.getByText("الصغار")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /عرض تفاصيل/ })).toHaveLength(3);
    expect(screen.getByText("مجانية")).toBeInTheDocument();
    expect(screen.getByText("السعر غير محدد")).toBeInTheDocument();
  });
});
