import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventInspector } from "@/features/admin/components/EventInspector";
import { ToastProvider } from "@/components/ui/ToastProvider";
import type { Event, Registration } from "@/lib/domain/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

const now = "2026-08-05T12:00:00.000Z";

const event: Event = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  title: "لقاء القراءة",
  kind: "club_event",
  audience: "adults",
  eventTypeLabel: "قراءة",
  startsAt: "2026-08-10T15:00:00.000Z",
  endsAt: "2026-08-10T17:00:00.000Z",
  capacity: 20,
  activeReservationCount: 16,
  priceHalalas: 7500,
  posterUrl: null,
  registrationStatus: "open",
  availability: "available",
  publicationStatus: "published",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

function registration(id: string, overrides: Partial<Registration> = {}): Registration {
  return {
    id,
    eventId: event.id,
    eventTitle: event.title,
    eventStartsAt: event.startsAt,
    attendeeName: `مسجلة ${id}`,
    phoneE164: "+966500000000",
    email: null,
    participantAge: null,
    guardianName: null,
    reference: `REF-${id}`,
    status: "registered",
    attendanceStatus: "pending",
    checkInStatus: "pending",
    paymentStatus: "unpaid",
    createdAt: now,
    ...overrides,
  } as Registration;
}

const registrationActions = {
  cancelRegistration: vi.fn(async () => ({ status: "success" as const })),
  confirmInvitation: vi.fn(async () => ({ status: "success" as const })),
  recordCheckIn: vi.fn(async () => ({ status: "success" as const })),
  revokeInvitation: vi.fn(async () => ({ status: "success" as const })),
  setPaymentStatus: vi.fn(async () => ({ saved: true as const })),
};

function renderInspector(overrides: Partial<React.ComponentProps<typeof EventInspector>> = {}) {
  return render(
    <ToastProvider>
    <EventInspector
      event={event}
      registered={[registration("r1", { paymentStatus: "paid_in_full" }), registration("r2")]}
      waitlist={[registration("w1", { status: "waitlisted" })]}
      allRegistrations={[]}
      feedback={[]}
      manualMessages={null}
      eventTemplate={null}
      globalTemplate={null}
      now={now}
      registrationActions={registrationActions}
      statusAction={vi.fn(async () => ({ status: "success" as const }))}
      {...overrides}
    />
    </ToastProvider>,
  );
}

describe("EventInspector", () => {
  it("puts the title, schedule and lifecycle in one calm header", () => {
    renderInspector();
    expect(screen.getByRole("heading", { name: "لقاء القراءة", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("قادمة")).toBeInTheDocument();
  });

  it("summarises capacity in the rail with a warn-toned meter near the cap", () => {
    renderInspector();
    const rail = screen.getByRole("complementary", { name: "ملخص الفعالية" });
    const meter = screen.getByRole("img", { name: "١٦ من ٢٠ مقعدًا محجوزة" });
    expect(rail).toContainElement(meter);
    expect(meter.firstElementChild).toHaveClass("event-inspector__meter-fill--warn");
    expect(screen.getByText("٤ مقعدًا متاحًا")).toBeInTheDocument();
  });

  it("reports expected revenue and settlement counts rather than an invented collected amount", () => {
    renderInspector();
    expect(screen.getByText("الإيرادات المتوقعة")).toBeInTheDocument();
    expect(screen.getByText(/سدّدت بالكامل ١ · متبقٍ ١/)).toBeInTheDocument();
  });

  it("collapses the workspace into three tabs and shows the roster first", () => {
    renderInspector();
    const tabs = screen.getAllByRole("tab").map((tab) => tab.textContent);
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toContain("التسجيلات");
    expect(tabs[1]).toContain("التواصل");
    expect(tabs[2]).toContain("الإعدادات");
    expect(screen.getByRole("tab", { name: /التسجيلات/ })).toHaveAttribute("aria-selected", "true");
  });

  it("surfaces the remaining-seat count beside the waitlist, inside the roster panel", () => {
    renderInspector();
    expect(screen.getByRole("region", { name: "قائمة الانتظار" })).toBeInTheDocument();
    expect(screen.getByText(/٤ مقعدًا متاحًا — ادعي من هنا/)).toBeInTheDocument();
  });

  it("tells the admin the waitlist is blocked when the event is full", () => {
    renderInspector({ event: { ...event, activeReservationCount: 20 } });
    expect(screen.getByText("اكتمل العدد. ستتاح الدعوات فور إلغاء أحد المقاعد.")).toBeInTheDocument();
  });

  it("hides the waitlist section entirely when nobody is waiting", () => {
    renderInspector({ waitlist: [] });
    expect(screen.queryByRole("region", { name: "قائمة الانتظار" })).not.toBeInTheDocument();
  });

  it("offers the live-day action only on the event's own day", () => {
    expect(screen.queryByRole("link", { name: "بدء وضع اليوم" })).not.toBeInTheDocument();
    renderInspector({ now: "2026-08-10T09:00:00.000Z" });
    expect(screen.getByRole("link", { name: "بدء وضع اليوم" })).toHaveAttribute("href", `/admin/events/${event.id}/live`);
  });

  it("warns about affected registrations when the event is cancelled", () => {
    renderInspector({ event: { ...event, publicationStatus: "cancelled" } });
    expect(screen.getByRole("region", { name: "إشعار إلغاء الفعالية" })).toHaveTextContent("٢ مسجّلات متأثرات");
  });
});
