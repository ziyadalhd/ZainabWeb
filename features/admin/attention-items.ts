import type { AdminServiceRequest, Event, Registration } from "@/lib/domain/types";
import { formatArabicNumber, formatSeatCapacity } from "@/lib/format/date";

export type AttentionTone = "urgent" | "warning" | "neutral";

export interface AttentionMember {
  id: string;
  description: string;
  href: string;
  deadline: number;
}

export interface AttentionGroup {
  id: string;
  tone: AttentionTone;
  title: string;
  deadline: number;
  members: readonly AttentionMember[];
}

export interface RecentItem {
  id: string;
  timestamp: string;
  label: string;
  detail: string;
  href: string;
}

function buildAttentionGroup(
  id: string,
  tone: AttentionTone,
  members: readonly AttentionMember[],
  singleTitle: string,
  pluralTitle: (count: number) => string,
): AttentionGroup | null {
  if (members.length === 0) return null;
  return {
    id,
    tone,
    title: members.length === 1 ? singleTitle : pluralTitle(members.length),
    deadline: Math.min(...members.map((member) => member.deadline)),
    members,
  };
}

function withinHours(value: string, now: number, hours: number) {
  const timestamp = new Date(value).getTime();
  return timestamp >= now && timestamp <= now + hours * 60 * 60 * 1000;
}

function withinPreviousHours(value: string, now: number, hours: number) {
  const timestamp = new Date(value).getTime();
  return timestamp <= now && timestamp >= now - hours * 60 * 60 * 1000;
}

export function buildAttentionGroups(
  events: readonly Event[],
  registrations: readonly Registration[],
  requests: readonly AdminServiceRequest[],
  now: number,
): AttentionGroup[] {
  const upcomingEvents = events
    .filter((event) => event.publicationStatus !== "archived" && new Date(event.startsAt).getTime() >= now)
    .sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime());
  const upcomingUnpaid = registrations.filter(
    (registration) =>
      registration.status === "registered" &&
      new Date(registration.eventStartsAt).getTime() >= now &&
      registration.priceHalalasAtBooking > 0 &&
      registration.paymentStatus === "unpaid",
  );
  const newRequests = requests.filter((request) => request.status === "new" && !request.contactedAt);
  const unconfirmedRegistrations = registrations.filter(
    (registration) => registration.status === "registered" && new Date(registration.eventStartsAt).getTime() >= now && !registration.confirmationSentAt,
  );

  const confirmationMembers: AttentionMember[] = unconfirmedRegistrations.map((registration) => ({
    id: `confirmation-${registration.id}`,
    description: `${registration.attendeeName} — ${registration.eventTitle}`,
    href: `/admin/registrations?view=upcoming&id=${registration.id}`,
    deadline: new Date(registration.eventStartsAt).getTime(),
  }));

  const requestMembers: AttentionMember[] = newRequests.map((request) => ({
    id: `request-${request.id}`,
    description: `${request.requesterName} — ${request.kind === "workshop_application" ? "طلب ورشة" : "طلب حجز مساحة"}`,
    href: "/admin/requests",
    deadline: new Date(request.createdAt).getTime(),
  }));

  const draftMembers: AttentionMember[] = events
    .filter((event) => event.publicationStatus === "draft" && (event.endsAt === null || event.priceHalalas === null))
    .map((event) => ({
      id: `draft-${event.id}`,
      description: `أكملي بيانات «${event.title}» قبل نشرها.`,
      href: `/admin/events?event=${event.id}#event-section-settings`,
      deadline: new Date(event.startsAt).getTime(),
    }));

  const seatMembers: AttentionMember[] = upcomingEvents
    .filter(
      (event) =>
        event.activeReservationCount < event.capacity &&
        registrations.some((registration) => registration.eventId === event.id && registration.status === "waitlisted"),
    )
    .map((event) => ({
      id: `seat-${event.id}`,
      description: `«${event.title}» لديها ${formatSeatCapacity(event.capacity - event.activeReservationCount)} متاحة. ادعي بديلة من مساحة التواصل.`,
      href: `/admin/events?event=${event.id}#event-section-communications`,
      deadline: new Date(event.startsAt).getTime(),
    }));

  const inviteMembers: AttentionMember[] = registrations
    .filter((registration) => registration.status === "invited" && registration.invitationExpiresAt && withinHours(registration.invitationExpiresAt, now, 24))
    .map((registration) => ({
      id: `invite-${registration.id}`,
      description: `${registration.attendeeName} — ${registration.eventTitle}`,
      href: `/admin/registrations?view=waitlist&id=${registration.id}`,
      deadline: new Date(registration.invitationExpiresAt as string).getTime(),
    }));

  const reminderMembers: AttentionMember[] = upcomingEvents
    .filter(
      (event) =>
        withinHours(event.startsAt, now, 24) &&
        registrations.some(
          (registration) => registration.eventId === event.id && registration.status === "registered" && registration.latestReminderPreparedAt === null,
        ),
    )
    .map((event) => ({
      id: `reminder-${event.id}`,
      description: `فعالية «${event.title}» تبدأ خلال ٢٤ ساعة.`,
      href: `/admin/events?event=${event.id}#event-section-communications`,
      deadline: new Date(event.startsAt).getTime(),
    }));

  const paymentMembers: AttentionMember[] =
    upcomingUnpaid.length > 0
      ? [
          {
            id: "payments",
            description: `${formatArabicNumber(upcomingUnpaid.length)} حجوزات مدفوعة لم يُسجّل دفعها بعد.`,
            href: "/admin/registrations?view=upcoming",
            deadline: Math.min(...upcomingUnpaid.map((registration) => new Date(registration.eventStartsAt).getTime())),
          },
        ]
      : [];

  const attention: AttentionGroup[] = [
    buildAttentionGroup("invite", "warning", inviteMembers, "دعوة انتظار تنتهي قريبًا", (count) => `${formatArabicNumber(count)} دعوات انتظار تنتهي قريبًا`),
    buildAttentionGroup(
      "reminder",
      "urgent",
      reminderMembers,
      "تذكيرات قريبة لم تُجهّز",
      (count) => `${formatArabicNumber(count)} فعاليات لديها تذكيرات قريبة لم تُجهّز`,
    ),
    buildAttentionGroup(
      "confirmation",
      "urgent",
      confirmationMembers,
      "تسجيل جديد يحتاج تأكيد واتساب",
      (count) => `${formatArabicNumber(count)} تسجيلات تنتظر تأكيد واتساب`,
    ),
    buildAttentionGroup("request", "urgent", requestMembers, "طلب يحتاج تواصلًا", (count) => `${formatArabicNumber(count)} طلبات تحتاج تواصلًا`),
    buildAttentionGroup("draft", "warning", draftMembers, "مسودة غير جاهزة للنشر", (count) => `${formatArabicNumber(count)} مسودات غير جاهزة للنشر`),
    buildAttentionGroup(
      "seat",
      "urgent",
      seatMembers,
      "مقعد متاح مع قائمة انتظار",
      (count) => `${formatArabicNumber(count)} فعاليات لديها مقاعد متاحة مع قائمة انتظار`,
    ),
    buildAttentionGroup("payment", "neutral", paymentMembers, "دفعات تحتاج تسجيلًا", () => "دفعات تحتاج تسجيلًا"),
  ].filter((group): group is AttentionGroup => group !== null);
  attention.sort((first, second) => first.deadline - second.deadline);
  return attention;
}

export function buildRecentItems(
  registrations: readonly Registration[],
  requests: readonly AdminServiceRequest[],
  now: number,
  limit: number,
): RecentItem[] {
  return [
    ...registrations.map((registration) => ({
      id: `registration-${registration.id}`,
      timestamp: registration.createdAt,
      label: `تسجيل جديد: ${registration.attendeeName}`,
      detail: registration.eventTitle,
      href: "/admin/registrations?view=upcoming",
    })),
    ...requests.map((request) => ({
      id: `request-${request.id}`,
      timestamp: request.createdAt,
      label: `طلب ${request.status === "new" ? "جديد" : "مُحدّث"}: ${request.requesterName}`,
      detail: request.kind === "workshop_application" ? "طلب ورشة" : "طلب حجز",
      href: "/admin/requests",
    })),
  ]
    .filter((activity) => withinPreviousHours(activity.timestamp, now, 24 * 7))
    .sort((first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime())
    .slice(0, limit);
}
