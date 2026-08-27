import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminHub } from "@/features/admin/components/AdminHub";
import type { Registration } from "@/lib/domain/types";

const now = new Date("2026-08-20T12:00:00.000Z").getTime();
const month = new Date(Date.UTC(2026, 7, 15, 12));

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

function renderHub(registrations: Registration[] = []) {
  return render(
    <AdminHub
      events={[]}
      registrations={registrations}
      requests={[]}
      now={now}
      calendarItems={[]}
      month={month}
      monthHrefPrevious="/admin?month=2026-07"
      monthHrefNext="/admin?month=2026-09"
      monthHrefCurrent="/admin"
    />,
  );
}

describe("AdminHub", () => {
  it("renders the calendar with month navigation and the primary create-event action", () => {
    renderHub();

    expect(screen.getByRole("link", { name: "الشهر السابق" })).toHaveAttribute("href", "/admin?month=2026-07");
    expect(screen.getByRole("link", { name: "الشهر التالي" })).toHaveAttribute("href", "/admin?month=2026-09");
    expect(screen.getByRole("link", { name: "فعالية جديدة" })).toHaveAttribute("href", "/admin/events/new");
  });

  it("shows a calm empty state in the attention rail when nothing needs work", () => {
    renderHub();
    expect(screen.getByText("لا توجد مهام تحتاج معالجة الآن.")).toBeInTheDocument();
  });

  it("surfaces an unconfirmed registration in the attention rail, opening the registrations lookup", () => {
    const registration = makeRegistration({ confirmationSentAt: null });
    renderHub([registration]);

    const item = screen.getByRole("link", { name: /تسجيل جديد يحتاج تأكيد واتساب/ });
    expect(item).toHaveAttribute("href", `/admin/registrations?view=upcoming&id=${registration.id}`);
  });

  it("lists recent activity under الجديد, capped at three items", () => {
    const registrations = [
      makeRegistration({ id: "r1", attendeeName: "١", createdAt: "2026-08-19T10:00:00.000Z" }),
      makeRegistration({ id: "r2", attendeeName: "٢", createdAt: "2026-08-19T11:00:00.000Z" }),
      makeRegistration({ id: "r3", attendeeName: "٣", createdAt: "2026-08-19T12:00:00.000Z" }),
      makeRegistration({ id: "r4", attendeeName: "٤", createdAt: "2026-08-19T13:00:00.000Z" }),
    ];
    renderHub(registrations);

    expect(screen.getByText("الجديد")).toBeInTheDocument();
    expect(screen.getAllByText(/تسجيل جديد:/)).toHaveLength(3);
  });
});
