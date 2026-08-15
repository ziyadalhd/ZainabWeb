import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventList } from "@/features/events/components/EventList";
import type { Event } from "@/lib/domain/types";

const events: readonly Event[] = [
  { id: "1", title: "لقاء للكبار", kind: "club_event", audience: "adults", eventTypeLabel: "لقاء", startsAt: "2026-08-10T15:00:00.000Z", endsAt: "2026-08-10T17:00:00.000Z", capacity: 30, activeReservationCount: 2, priceHalalas: 0, posterUrl: null, registrationStatus: "open", availability: "available", publicationStatus: "published", createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" },
  { id: "2", title: "ورشة لليافعين", kind: "club_event", audience: "youth", eventTypeLabel: "ورشة", startsAt: "2026-08-11T15:00:00.000Z", endsAt: "2026-08-11T17:00:00.000Z", capacity: 20, activeReservationCount: 20, priceHalalas: 7500, posterUrl: null, registrationStatus: "open", availability: "full", publicationStatus: "published", createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" },
  { id: "3", title: "قراءة للصغار", kind: "club_event", audience: "children", eventTypeLabel: "قراءة", startsAt: "2026-08-12T15:00:00.000Z", endsAt: null, capacity: 10, activeReservationCount: 0, priceHalalas: null, posterUrl: null, registrationStatus: "closed", availability: "closed", publicationStatus: "published", createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" },
];

describe("EventList", () => {
  it("renders the Arabic empty state", () => {
    render(<EventList events={[]} />);
    expect(screen.getByRole("heading", { name: "ما فيه فعاليات قادمة الآن" })).toBeInTheDocument();
  });

  it("renders event cards and all approved audience labels", () => {
    render(<EventList events={events} />);
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByText("الكبار")).toBeInTheDocument();
    expect(screen.getByText("اليافعون")).toBeInTheDocument();
    expect(screen.getByText("الصغار")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /احجزي مكانك: لقاء للكبار/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /انضمي لقائمة الانتظار: ورشة لليافعين/ })).toBeInTheDocument();
    expect(screen.getByText("التسجيل متاح")).toBeInTheDocument();
    expect(screen.getByText("للأسف اكتملت المقاعد — تقدرين تنضمين لقائمة الانتظار")).toBeInTheDocument();
    expect(screen.getByText("التسجيل مقفل حاليًا، وتقدرين تشوفين التفاصيل")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /شوفي التفاصيل: قراءة للصغار/ })).toBeInTheDocument();
    expect(screen.getByText("مجانية")).toBeInTheDocument();
    expect(screen.getByText("السعر غير محدد")).toBeInTheDocument();
  });
});
