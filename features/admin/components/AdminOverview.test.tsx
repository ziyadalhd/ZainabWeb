import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminOverview } from "@/features/admin/components/AdminOverview";
import type { AdminServiceRequest, Event, Registration } from "@/lib/domain/types";

const now = new Date("2026-08-20T12:00:00.000Z").getTime();

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
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeRequest(overrides: Partial<AdminServiceRequest> = {}): AdminServiceRequest {
  return {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    reference: "REQ-1",
    kind: "space_booking",
    requesterName: "نورة",
    phoneE164: "+966500000002",
    email: null,
    status: "new",
    requestedDate: "2026-09-10",
    requestedStartTime: "19:30:00",
    requestedEndTime: "21:30:00",
    attendeeCount: 10,
    useOrOccasionType: "لقاء خاص",
    workshopTitle: null,
    workshopDescription: null,
    workshopTargetAudience: null,
    workshopDuration: null,
    workshopExpectedAttendance: null,
    workshopRequirements: null,
    workshopPortfolioUrl: null,
    notes: null,
    offerPriceHalalas: null,
    offerTerms: null,
    offerExpiresAt: null,
    paymentStatus: "unpaid",
    createdAt: "2026-08-19T00:00:00.000Z",
    contactedAt: null,
    ...overrides,
  };
}

describe("AdminOverview attention list", () => {
  it("shows a calm empty state when nothing needs attention", () => {
    render(<AdminOverview events={[]} registrations={[]} requests={[]} now={now} />);
    expect(screen.getByText("لا توجد مهام تحتاج معالجة الآن.")).toBeInTheDocument();
  });

  it("flags a registered attendee with no confirmation sent", () => {
    const registration = makeRegistration({ confirmationSentAt: null });
    render(<AdminOverview events={[]} registrations={[registration]} requests={[]} now={now} />);

    const item = screen.getByRole("link", { name: /تسجيل جديد يحتاج تأكيد واتساب/ });
    expect(item).toHaveAttribute("href", "/admin/registrations?view=upcoming");
  });

  it("flags a new, uncontacted service request", () => {
    const request = makeRequest({ status: "new", contactedAt: null });
    render(<AdminOverview events={[]} registrations={[]} requests={[request]} now={now} />);

    const item = screen.getByRole("link", { name: /طلب يحتاج تواصلًا/ });
    expect(item).toHaveAttribute("href", "/admin/requests");
  });

  it("does not flag a service request that has already been contacted", () => {
    const request = makeRequest({ status: "new", contactedAt: "2026-08-19T01:00:00.000Z" });
    render(<AdminOverview events={[]} registrations={[]} requests={[request]} now={now} />);

    expect(screen.queryByText(/طلب يحتاج تواصلًا/)).not.toBeInTheDocument();
  });

  it("flags a draft event missing an end time or price before it can publish", () => {
    const event = makeEvent({ publicationStatus: "draft", endsAt: null });
    render(<AdminOverview events={[event]} registrations={[]} requests={[]} now={now} />);

    const item = screen.getByRole("link", { name: /مسودة غير جاهزة للنشر/ });
    expect(item).toHaveAttribute("href", `/admin/events/${event.id}/edit`);
  });

  it("flags an event with an available seat while a registrant waits", () => {
    const event = makeEvent({ capacity: 10, activeReservationCount: 8 });
    const waitlisted = makeRegistration({ id: "waitlisted-1", eventId: event.id, status: "waitlisted" });
    render(<AdminOverview events={[event]} registrations={[waitlisted]} requests={[]} now={now} />);

    expect(screen.getByText(/مقعد متاح مع قائمة انتظار/)).toBeInTheDocument();
  });

  it("does not flag capacity when no one is waiting", () => {
    const event = makeEvent({ capacity: 10, activeReservationCount: 8 });
    render(<AdminOverview events={[event]} registrations={[]} requests={[]} now={now} />);

    expect(screen.queryByText(/مقعد متاح مع قائمة انتظار/)).not.toBeInTheDocument();
  });

  it("flags a waitlist invitation expiring within 24 hours", () => {
    const registration = makeRegistration({
      status: "invited",
      invitationExpiresAt: new Date(now + 6 * 60 * 60 * 1000).toISOString(),
    });
    render(<AdminOverview events={[]} registrations={[registration]} requests={[]} now={now} />);

    expect(screen.getByText(/دعوة انتظار تنتهي قريبًا/)).toBeInTheDocument();
  });

  it("flags an unprepared reminder for an event starting within 24 hours", () => {
    const event = makeEvent({ startsAt: new Date(now + 6 * 60 * 60 * 1000).toISOString() });
    const registration = makeRegistration({
      eventId: event.id,
      eventStartsAt: event.startsAt,
      latestReminderPreparedAt: null,
    });
    render(<AdminOverview events={[event]} registrations={[registration]} requests={[]} now={now} />);

    expect(screen.getByText(/تذكيرات قريبة لم تُجهّز/)).toBeInTheDocument();
  });

  it("aggregates unpaid upcoming paid registrations into a single item", () => {
    const first = makeRegistration({ id: "paid-1", priceHalalasAtBooking: 5000, paymentStatus: "unpaid" });
    const second = makeRegistration({ id: "paid-2", priceHalalasAtBooking: 5000, paymentStatus: "unpaid" });
    render(<AdminOverview events={[]} registrations={[first, second]} requests={[]} now={now} />);

    expect(screen.getByText(/٢ حجوزات مدفوعة لم يُسجّل دفعها بعد/)).toBeInTheDocument();
  });

  it("does not aggregate a payment item when the registration is free", () => {
    const registration = makeRegistration({ priceHalalasAtBooking: 0, paymentStatus: "unpaid" });
    render(<AdminOverview events={[]} registrations={[registration]} requests={[]} now={now} />);

    expect(screen.queryByText(/دفعات تحتاج تسجيلًا/)).not.toBeInTheDocument();
  });

  it("shows the next upcoming event on the operational ribbon", () => {
    const event = makeEvent();
    render(<AdminOverview events={[event]} registrations={[]} requests={[]} now={now} />);

    expect(screen.getByRole("link", { name: /الفعالية التالية/ })).toHaveAttribute("href", `/admin/events/${event.id}/edit`);
  });
});
