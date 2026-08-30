import { describe, expect, it } from "vitest";
import { buildRecentItems, buildTriageItems } from "@/features/admin/attention-items";
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

describe("buildTriageItems", () => {
  it("returns nothing when there is no work to do", () => {
    expect(buildTriageItems([], [], [], now)).toEqual([]);
  });

  it("headlines a registered attendee with no confirmation sent by their own name, not the category", () => {
    const event = makeEvent();
    const registration = makeRegistration({ confirmationSentAt: null });
    const [item] = buildTriageItems([event], [registration], [], now);

    expect(item?.subjectName).toBe(registration.attendeeName);
    expect(item?.actions).toEqual([
      { kind: "link", variant: "primary", label: "فتح مساحة التواصل", href: `/admin/events?event=${event.id}#event-section-communications` },
    ]);
  });

  it("gives every unconfirmed registration its own card, never a grouped count", () => {
    const first = makeRegistration({ id: "unconfirmed-1", confirmationSentAt: null });
    const second = makeRegistration({ id: "unconfirmed-2", confirmationSentAt: null, attendeeName: "سارة" });
    const items = buildTriageItems([], [first, second], [], now);

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.subjectName)).toEqual([first.attendeeName, second.attendeeName]);
  });

  it("headlines a new, uncontacted service request by the requester's name and links straight to it", () => {
    const request = makeRequest({ status: "new", contactedAt: null });
    const [item] = buildTriageItems([], [], [request], now);

    expect(item?.subjectName).toBe(request.requesterName);
    expect(item?.urgencyLabel).toContain("حجز مساحة");
    expect(item?.actions).toEqual([
      { kind: "link", variant: "primary", label: "مراجعة الطلب", href: `/admin/requests?id=${encodeURIComponent(request.id)}` },
    ]);
  });

  it("does not flag a service request that has already been contacted", () => {
    const request = makeRequest({ status: "new", contactedAt: "2026-08-19T01:00:00.000Z" });
    expect(buildTriageItems([], [], [request], now)).toEqual([]);
  });

  it("flags a draft event missing an end time or price, linking to the panel's settings section", () => {
    const event = makeEvent({ publicationStatus: "draft", endsAt: null });
    const [item] = buildTriageItems([event], [], [], now);

    expect(item?.subjectName).toBe(event.title);
    expect(item?.context).toContain("موعد الانتهاء");
    expect(item?.actions).toEqual([{ kind: "link", variant: "primary", label: "إكمال الإعدادات", href: `/admin/events?event=${event.id}#event-section-settings` }]);
  });

  it("flags an event with an available seat while a registrant waits, linking to the panel's communications section", () => {
    const event = makeEvent({ capacity: 10, activeReservationCount: 8 });
    const waitlisted = makeRegistration({ id: "waitlisted-1", eventId: event.id, status: "waitlisted" });
    const [item] = buildTriageItems([event], [waitlisted], [], now);

    expect(item?.subjectName).toBe(event.title);
    expect(item?.actions).toEqual([{ kind: "link", variant: "primary", label: "فتح مساحة التواصل", href: `/admin/events?event=${event.id}#event-section-communications` }]);
  });

  it("does not flag capacity when no one is waiting", () => {
    const event = makeEvent({ capacity: 10, activeReservationCount: 8 });
    expect(buildTriageItems([event], [], [], now)).toEqual([]);
  });

  it("flags a waitlist invitation expiring within 24 hours, with confirm and revoke as inline actions", () => {
    const event = makeEvent();
    const registration = makeRegistration({
      eventId: event.id,
      status: "invited",
      invitationExpiresAt: new Date(now + 40 * 60 * 1000).toISOString(),
    });
    const [item] = buildTriageItems([event], [registration], [], now);

    expect(item?.subjectName).toBe(registration.attendeeName);
    expect(item?.urgencyLabel).toBe("تنتهي الدعوة خلال ٤٠ دقيقة");
    expect(item?.actions).toEqual([
      { kind: "revoke-invitation", variant: "secondary", label: "إعادة للقائمة", registrationId: registration.id },
      { kind: "confirm-invitation", variant: "primary", label: "تأكيد الدعوة", registrationId: registration.id },
    ]);
  });

  it("flags an unprepared reminder for an event starting within 24 hours, linking to the panel's communications section", () => {
    const event = makeEvent({ startsAt: new Date(now + 6 * 60 * 60 * 1000).toISOString() });
    const registration = makeRegistration({
      eventId: event.id,
      eventStartsAt: event.startsAt,
      latestReminderPreparedAt: null,
    });
    const [item] = buildTriageItems([event], [registration], [], now);

    expect(item?.subjectName).toBe(event.title);
    expect(item?.actions).toEqual([{ kind: "link", variant: "primary", label: "فتح مساحة التواصل", href: `/admin/events?event=${event.id}#event-section-communications` }]);
  });

  it("gives every unpaid upcoming registration its own card with a precise link, never an aggregate count", () => {
    const first = makeRegistration({ id: "paid-1", priceHalalasAtBooking: 5000, paymentStatus: "unpaid" });
    const second = makeRegistration({ id: "paid-2", priceHalalasAtBooking: 5000, paymentStatus: "unpaid" });
    const items = buildTriageItems([], [first, second], [], now);

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.actions)).toEqual([
      [{ kind: "link", variant: "primary", label: "متابعة الدفع", href: `/admin/registrations?view=upcoming&id=${first.id}` }],
      [{ kind: "link", variant: "primary", label: "متابعة الدفع", href: `/admin/registrations?view=upcoming&id=${second.id}` }],
    ]);
  });

  it("does not flag a payment item when the registration is free", () => {
    const registration = makeRegistration({ priceHalalasAtBooking: 0, paymentStatus: "unpaid" });
    expect(buildTriageItems([], [registration], [], now)).toEqual([]);
  });

  it("sorts items by nearest deadline rather than category order — the priority logic carried over unchanged", () => {
    const soonEvent = makeEvent({
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      publicationStatus: "draft",
      endsAt: null,
      startsAt: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
    });
    const laterInvite = makeRegistration({
      id: "invite-later",
      status: "invited",
      invitationExpiresAt: new Date(now + 20 * 60 * 60 * 1000).toISOString(),
    });
    const items = buildTriageItems([soonEvent], [laterInvite], [], now);

    expect(items.map((item) => item.id)).toEqual([`draft-${soonEvent.id}`, `invite-${laterInvite.id}`]);
  });
});

describe("buildRecentItems", () => {
  it("caps the list at the given limit", () => {
    const registrations = [
      makeRegistration({ id: "r1", createdAt: "2026-08-19T10:00:00.000Z" }),
      makeRegistration({ id: "r2", createdAt: "2026-08-19T11:00:00.000Z" }),
      makeRegistration({ id: "r3", createdAt: "2026-08-19T12:00:00.000Z" }),
      makeRegistration({ id: "r4", createdAt: "2026-08-19T13:00:00.000Z" }),
    ];
    const items = buildRecentItems(registrations, [], now, 3);
    expect(items).toHaveLength(3);
  });

  it("excludes activity older than the previous seven days", () => {
    const stale = makeRegistration({ createdAt: "2026-08-01T00:00:00.000Z" });
    expect(buildRecentItems([stale], [], now, 3)).toEqual([]);
  });

  it("orders newest first", () => {
    const older = makeRegistration({ id: "older", createdAt: "2026-08-19T10:00:00.000Z", attendeeName: "الأولى" });
    const newer = makeRegistration({ id: "newer", createdAt: "2026-08-19T11:00:00.000Z", attendeeName: "الثانية" });
    const items = buildRecentItems([older, newer], [], now, 3);
    expect(items.map((item) => item.id)).toEqual([`registration-${newer.id}`, `registration-${older.id}`]);
  });
});
