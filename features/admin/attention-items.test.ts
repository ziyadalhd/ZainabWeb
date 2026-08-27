import { describe, expect, it } from "vitest";
import { buildAttentionGroups, buildRecentItems } from "@/features/admin/attention-items";
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

describe("buildAttentionGroups", () => {
  it("returns nothing when there is no work to do", () => {
    expect(buildAttentionGroups([], [], [], now)).toEqual([]);
  });

  it("flags a registered attendee with no confirmation sent, carrying the registration's identity", () => {
    const registration = makeRegistration({ confirmationSentAt: null });
    const [group] = buildAttentionGroups([], [registration], [], now);

    expect(group?.title).toBe("تسجيل جديد يحتاج تأكيد واتساب");
    expect(group?.members).toHaveLength(1);
    expect(group?.members[0]?.href).toBe(`/admin/registrations?view=upcoming&id=${registration.id}`);
  });

  it("groups multiple unconfirmed registrations into one row with a count, each member carrying its own identity", () => {
    const first = makeRegistration({ id: "unconfirmed-1", confirmationSentAt: null });
    const second = makeRegistration({ id: "unconfirmed-2", confirmationSentAt: null, attendeeName: "سارة" });
    const [group] = buildAttentionGroups([], [first, second], [], now);

    expect(group?.title).toBe("٢ تسجيلات تنتظر تأكيد واتساب");
    expect(group?.members.map((member) => member.href)).toEqual([
      `/admin/registrations?view=upcoming&id=${first.id}`,
      `/admin/registrations?view=upcoming&id=${second.id}`,
    ]);
  });

  it("flags a new, uncontacted service request", () => {
    const request = makeRequest({ status: "new", contactedAt: null });
    const [group] = buildAttentionGroups([], [], [request], now);

    expect(group?.title).toBe("طلب يحتاج تواصلًا");
    expect(group?.members[0]?.href).toBe("/admin/requests");
  });

  it("does not flag a service request that has already been contacted", () => {
    const request = makeRequest({ status: "new", contactedAt: "2026-08-19T01:00:00.000Z" });
    expect(buildAttentionGroups([], [], [request], now)).toEqual([]);
  });

  it("flags a draft event missing an end time or price, linking to the panel's settings section", () => {
    const event = makeEvent({ publicationStatus: "draft", endsAt: null });
    const [group] = buildAttentionGroups([event], [], [], now);

    expect(group?.title).toBe("مسودة غير جاهزة للنشر");
    expect(group?.members[0]?.href).toBe(`/admin/events?event=${event.id}#event-section-settings`);
  });

  it("flags an event with an available seat while a registrant waits, linking to the panel's communications section", () => {
    const event = makeEvent({ capacity: 10, activeReservationCount: 8 });
    const waitlisted = makeRegistration({ id: "waitlisted-1", eventId: event.id, status: "waitlisted" });
    const [group] = buildAttentionGroups([event], [waitlisted], [], now);

    expect(group?.title).toBe("مقعد متاح مع قائمة انتظار");
    expect(group?.members[0]?.href).toBe(`/admin/events?event=${event.id}#event-section-communications`);
  });

  it("does not flag capacity when no one is waiting", () => {
    const event = makeEvent({ capacity: 10, activeReservationCount: 8 });
    expect(buildAttentionGroups([event], [], [], now)).toEqual([]);
  });

  it("flags a waitlist invitation expiring within 24 hours, carrying the registration's identity", () => {
    const registration = makeRegistration({
      status: "invited",
      invitationExpiresAt: new Date(now + 6 * 60 * 60 * 1000).toISOString(),
    });
    const [group] = buildAttentionGroups([], [registration], [], now);

    expect(group?.title).toBe("دعوة انتظار تنتهي قريبًا");
    expect(group?.members[0]?.href).toBe(`/admin/registrations?view=waitlist&id=${registration.id}`);
  });

  it("flags an unprepared reminder for an event starting within 24 hours, linking to the panel's communications section", () => {
    const event = makeEvent({ startsAt: new Date(now + 6 * 60 * 60 * 1000).toISOString() });
    const registration = makeRegistration({
      eventId: event.id,
      eventStartsAt: event.startsAt,
      latestReminderPreparedAt: null,
    });
    const [group] = buildAttentionGroups([event], [registration], [], now);

    expect(group?.title).toBe("تذكيرات قريبة لم تُجهّز");
    expect(group?.members[0]?.href).toBe(`/admin/events?event=${event.id}#event-section-communications`);
  });

  it("aggregates unpaid upcoming paid registrations into a single item", () => {
    const first = makeRegistration({ id: "paid-1", priceHalalasAtBooking: 5000, paymentStatus: "unpaid" });
    const second = makeRegistration({ id: "paid-2", priceHalalasAtBooking: 5000, paymentStatus: "unpaid" });
    const [group] = buildAttentionGroups([], [first, second], [], now);

    expect(group?.members[0]?.description).toContain("٢ حجوزات مدفوعة لم يُسجّل دفعها بعد");
  });

  it("does not aggregate a payment item when the registration is free", () => {
    const registration = makeRegistration({ priceHalalasAtBooking: 0, paymentStatus: "unpaid" });
    expect(buildAttentionGroups([], [registration], [], now)).toEqual([]);
  });

  it("sorts groups by nearest deadline rather than category order", () => {
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
    const groups = buildAttentionGroups([soonEvent], [laterInvite], [], now);

    expect(groups.map((group) => group.id)).toEqual(["draft", "invite"]);
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
