import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminHub } from "@/features/admin/components/AdminHub";
import { ToastProvider } from "@/components/ui/ToastProvider";
import type { Event, Registration } from "@/lib/domain/types";
import type { ActionResult } from "@/lib/data/action-result";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const now = new Date("2026-08-20T12:00:00.000Z").getTime();
const month = new Date(Date.UTC(2026, 7, 15, 12));

const registrationActions = {
  confirmInvitation: vi.fn(async (): Promise<ActionResult> => ({ status: "success" as const })),
  revokeInvitation: vi.fn(async (): Promise<ActionResult> => ({ status: "success" as const })),
};

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
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
    publicationStatus: "published",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeRegistration(overrides: Partial<Registration> = {}): Registration {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    reference: "REF-1",
    eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    eventTitle: "لقاء القراءة",
    eventStartsAt: "2026-08-25T15:00:00.000Z",
    attendeeName: "مشاركة",
    phoneE164: "+966500000001",
    email: null,
    participantAge: null,
    guardianName: null,
    guardianConsent: false,
    priceHalalasAtBooking: 0,
    status: "registered",
    attendanceStatus: "pending",
    checkInStatus: "pending",
    checkedInAt: null,
    paymentStatus: "unpaid",
    invitationExpiresAt: null,
    latestReminderPreparedAt: "2026-08-01T00:00:00.000Z",
    latestReminderSentAt: null,
    confirmationSentAt: "2026-08-01T00:00:00.000Z",
    createdAt: "2026-08-20T09:00:00.000Z",
    ...overrides,
  };
}

function renderHub(events: Event[] = [], registrations: Registration[] = []) {
  return render(
    <ToastProvider>
      <AdminHub
        events={events}
        registrations={registrations}
        requests={[]}
        now={now}
        pulseItems={[]}
        selectedDay={month}
        today={month}
        dayHrefFor={(day) => `/admin?day=${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(day.getUTCDate()).padStart(2, "0")}`}
        calendarHref="/admin?calendar=1"
        registrationActions={registrationActions}
      />
    </ToastProvider>,
  );
}

describe("AdminHub", () => {
  it("offers the primary create-event action and a way to open the full calendar", () => {
    renderHub();

    expect(screen.getByRole("link", { name: "فعالية جديدة" })).toHaveAttribute("href", "/admin/events/new");
    expect(screen.getByRole("link", { name: "عرض التقويم الكامل" })).toHaveAttribute("href", "/admin?calendar=1");
  });

  it("shows a calm empty state in the triage stream when nothing needs work", () => {
    renderHub();
    expect(screen.getByText("لا توجد مهام تحتاج معالجة الآن.")).toBeInTheDocument();
  });

  it("headlines an unconfirmed registration by name and links to the event's communications section", () => {
    const event = makeEvent();
    const registration = makeRegistration({ confirmationSentAt: null });
    renderHub([event], [registration]);

    expect(screen.getByText(registration.attendeeName)).toBeInTheDocument();
    const item = screen.getByRole("link", { name: "فتح مساحة التواصل" });
    expect(item).toHaveAttribute("href", `/admin/events?event=${event.id}#event-section-communications`);
  });

  it("offers an inline confirm action for a waitlist invitation expiring soon, with no navigation", () => {
    const event = makeEvent();
    const registration = makeRegistration({
      eventId: event.id,
      status: "invited",
      invitationExpiresAt: new Date(now + 40 * 60 * 1000).toISOString(),
    });
    renderHub([event], [registration]);

    expect(screen.getByText(registration.attendeeName)).toBeInTheDocument();
    expect(screen.getByText("تنتهي الدعوة خلال ٤٠ دقيقة")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تأكيد الدعوة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إعادة للقائمة" })).toBeInTheDocument();
  });

  it("exposes the triage stream as a real list, each item announcing its own subject and urgency (Phase 5 a11y)", () => {
    const event = makeEvent();
    const registration = makeRegistration({
      eventId: event.id,
      status: "invited",
      invitationExpiresAt: new Date(now + 40 * 60 * 1000).toISOString(),
    });
    renderHub([event], [registration]);

    const list = screen.getByRole("list", { name: "قائمة المهام" });
    const items = screen.getAllByRole("listitem");
    expect(list).toContainElement(items[0]!);
    expect(items[0]).toHaveAccessibleName(`${registration.attendeeName} — تنتهي الدعوة خلال ٤٠ دقيقة`);
  });

  it("renders Today's Pulse from the given pulse items", () => {
    render(
      <ToastProvider>
        <AdminHub
          events={[]}
          registrations={[]}
          requests={[]}
          now={now}
          pulseItems={[
            {
              id: "event-1",
              href: "/admin?event=1",
              timeLabel: "١١:٠٠ ص",
              title: "نادي القراءة الصغير",
              isEvent: true,
              audience: "children",
              capacityLabel: "١٢/١٥",
              conflictCount: 0,
            },
          ]}
          selectedDay={month}
          today={month}
          dayHrefFor={() => "/admin"}
          calendarHref="/admin?calendar=1"
          registrationActions={registrationActions}
        />
      </ToastProvider>,
    );

    expect(screen.getByText("نبض اليوم")).toBeInTheDocument();
    expect(screen.getByText("نادي القراءة الصغير")).toBeInTheDocument();
    expect(screen.getByText("للأطفال")).toBeInTheDocument();
  });

  it("lists recent activity under الجديد, capped at three items", () => {
    const registrations = [
      makeRegistration({ id: "r1", attendeeName: "١", createdAt: "2026-08-19T10:00:00.000Z" }),
      makeRegistration({ id: "r2", attendeeName: "٢", createdAt: "2026-08-19T11:00:00.000Z" }),
      makeRegistration({ id: "r3", attendeeName: "٣", createdAt: "2026-08-19T12:00:00.000Z" }),
      makeRegistration({ id: "r4", attendeeName: "٤", createdAt: "2026-08-19T13:00:00.000Z" }),
    ];
    renderHub([], registrations);

    expect(screen.getByText("الجديد")).toBeInTheDocument();
    expect(screen.getAllByText(/تسجيل جديد:/)).toHaveLength(3);
  });
});
