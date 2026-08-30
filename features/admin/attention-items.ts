import type { AdminServiceRequest, Event, Registration } from "@/lib/domain/types";
import { formatArabicEventTimeRange, formatArabicNumber, formatArabicRequestedSchedule, formatSeatCapacity } from "@/lib/format/date";
import { formatDeadlineLabel, formatElapsedLabel, formatRelativeEventDay } from "@/features/admin/relative-time";

export type TriageTone = "urgent" | "warning" | "neutral";
export type TriageIcon = "clock" | "envelope" | "card" | "request" | "draft" | "seat";

export type TriageAction =
  | { kind: "link"; variant: "primary" | "secondary"; label: string; href: string }
  | { kind: "confirm-invitation"; variant: "primary" | "secondary"; label: string; registrationId: string }
  | { kind: "revoke-invitation"; variant: "primary" | "secondary"; label: string; registrationId: string };

export interface TriageItem {
  id: string;
  icon: TriageIcon;
  tone: TriageTone;
  /** The person or event this item is about — always the headline, never the category. */
  subjectName: string;
  /** A short, self-timed tag, e.g. "تنتهي الدعوة خلال ٤٠ دقيقة". */
  urgencyLabel: string;
  /** A self-contained sentence: enough context to decide without navigating anywhere. */
  context: string;
  actions: readonly TriageAction[];
  /** Sort key only — nearest deadline first, across every category. */
  deadline: number;
}

export interface RecentItem {
  id: string;
  timestamp: string;
  label: string;
  detail: string;
  href: string;
}

function withinHours(value: string, now: number, hours: number): boolean {
  const timestamp = new Date(value).getTime();
  return timestamp >= now && timestamp <= now + hours * 60 * 60 * 1000;
}

function withinPreviousHours(value: string, now: number, hours: number): boolean {
  const timestamp = new Date(value).getTime();
  return timestamp <= now && timestamp >= now - hours * 60 * 60 * 1000;
}

function requestKindLabel(kind: AdminServiceRequest["kind"]): string {
  return kind === "workshop_application" ? "طلب ورشة" : kind === "space_booking" ? "حجز مساحة" : "طلب قديم";
}

function requestContext(request: AdminServiceRequest): string {
  if (request.kind === "workshop_application") {
    return request.workshopTargetAudience
      ? `تقترح ورشة «${request.workshopTitle ?? "بلا عنوان"}» — ${request.workshopTargetAudience}.`
      : `تقترح ورشة «${request.workshopTitle ?? "بلا عنوان"}».`;
  }
  const occasion = request.useOrOccasionType ?? "مناسبة خاصة";
  const attendees = request.attendeeCount ? ` لعدد ${formatArabicNumber(request.attendeeCount)}` : "";
  const schedule = formatArabicRequestedSchedule(request.requestedDate, request.requestedStartTime, request.requestedEndTime);
  return `${occasion}${attendees} — ${schedule}.`;
}

export function buildTriageItems(
  events: readonly Event[],
  registrations: readonly Registration[],
  requests: readonly AdminServiceRequest[],
  now: number,
): TriageItem[] {
  const eventsById = new Map(events.map((event) => [event.id, event]));
  const upcomingEvents = events
    .filter((event) => event.publicationStatus !== "archived" && new Date(event.startsAt).getTime() >= now)
    .sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime());

  const items: TriageItem[] = [];

  // Waitlist invitations expiring soon — the design's primary card shape: the guest is the
  // headline, the deadline is minute-precise, and both the confirming and reverting action are
  // real, inline, one-click mutations (no navigation).
  for (const registration of registrations) {
    if (registration.status !== "invited" || !registration.invitationExpiresAt) continue;
    if (!withinHours(registration.invitationExpiresAt, now, 24)) continue;
    const deadline = new Date(registration.invitationExpiresAt).getTime();
    const event = eventsById.get(registration.eventId);
    const schedule = event
      ? `${formatRelativeEventDay(event.startsAt, now)} ${formatArabicEventTimeRange(event.startsAt)}، السعة ${formatArabicNumber(event.activeReservationCount)}/${formatArabicNumber(event.capacity)}`
      : formatRelativeEventDay(registration.eventStartsAt, now);
    items.push({
      id: `invite-${registration.id}`,
      icon: "clock",
      tone: "urgent",
      subjectName: registration.attendeeName,
      urgencyLabel: `تنتهي الدعوة ${formatDeadlineLabel(deadline, now)}`,
      context: `على قائمة انتظار «${registration.eventTitle}» — ${schedule}.`,
      actions: [
        { kind: "revoke-invitation", variant: "secondary", label: "إعادة للقائمة", registrationId: registration.id },
        { kind: "confirm-invitation", variant: "primary", label: "تأكيد الدعوة", registrationId: registration.id },
      ],
      deadline,
    });
  }

  // New, uncontacted service requests.
  for (const request of requests) {
    if (request.status !== "new" || request.contactedAt) continue;
    const deadline = new Date(request.createdAt).getTime();
    items.push({
      id: `request-${request.id}`,
      icon: "request",
      tone: "urgent",
      subjectName: request.requesterName,
      urgencyLabel: `${requestKindLabel(request.kind)} — ${formatElapsedLabel(deadline, now)}`,
      context: requestContext(request),
      actions: [{ kind: "link", variant: "primary", label: "مراجعة الطلب", href: `/admin/requests?id=${encodeURIComponent(request.id)}` }],
      deadline,
    });
  }

  // Draft events missing what publishing requires.
  for (const event of events) {
    if (event.publicationStatus !== "draft") continue;
    if (event.endsAt !== null && event.priceHalalas !== null) continue;
    const deadline = new Date(event.startsAt).getTime();
    const missing = [event.endsAt === null ? "موعد الانتهاء" : null, event.priceHalalas === null ? "السعر" : null].filter(
      (value): value is string => value !== null,
    );
    items.push({
      id: `draft-${event.id}`,
      icon: "draft",
      tone: "warning",
      subjectName: event.title,
      urgencyLabel: `تبدأ ${formatDeadlineLabel(deadline, now)}`,
      context: `أكملي ${missing.join(" و")} قبل نشرها.`,
      actions: [{ kind: "link", variant: "primary", label: "إكمال الإعدادات", href: `/admin/events?event=${event.id}#event-section-settings` }],
      deadline,
    });
  }

  // Available seats with a guest still waiting on the list.
  for (const event of upcomingEvents) {
    if (event.activeReservationCount >= event.capacity) continue;
    if (!registrations.some((registration) => registration.eventId === event.id && registration.status === "waitlisted")) continue;
    const deadline = new Date(event.startsAt).getTime();
    items.push({
      id: `seat-${event.id}`,
      icon: "seat",
      tone: "urgent",
      subjectName: event.title,
      urgencyLabel: `تبدأ ${formatDeadlineLabel(deadline, now)}`,
      context: `${formatSeatCapacity(event.capacity - event.activeReservationCount)} متاحة مع ضيوف على قائمة الانتظار. ادعي بديلة من مساحة التواصل.`,
      actions: [{ kind: "link", variant: "primary", label: "فتح مساحة التواصل", href: `/admin/events?event=${event.id}#event-section-communications` }],
      deadline,
    });
  }

  // Events starting within 24 hours with at least one registered guest lacking a prepared
  // reminder. Event-level rather than per-guest: the task is preparing the event's reminders,
  // not any single registrant's.
  for (const event of upcomingEvents) {
    if (!withinHours(event.startsAt, now, 24)) continue;
    const unprepared = registrations.filter(
      (registration) => registration.eventId === event.id && registration.status === "registered" && registration.latestReminderPreparedAt === null,
    );
    if (unprepared.length === 0) continue;
    const deadline = new Date(event.startsAt).getTime();
    items.push({
      id: `reminder-${event.id}`,
      icon: "envelope",
      tone: "urgent",
      subjectName: event.title,
      urgencyLabel: `تبدأ ${formatDeadlineLabel(deadline, now)}`,
      context: `${formatArabicNumber(unprepared.length)} من المسجَّلات بلا تذكير مُجهّز. جهّزيه من مساحة التواصل.`,
      actions: [{ kind: "link", variant: "primary", label: "فتح مساحة التواصل", href: `/admin/events?event=${event.id}#event-section-communications` }],
      deadline,
    });
  }

  // Registered guests whose WhatsApp confirmation hasn't been sent yet.
  for (const registration of registrations) {
    if (registration.status !== "registered" || registration.confirmationSentAt) continue;
    if (new Date(registration.eventStartsAt).getTime() < now) continue;
    const deadline = new Date(registration.eventStartsAt).getTime();
    const event = eventsById.get(registration.eventId);
    items.push({
      id: `confirmation-${registration.id}`,
      icon: "envelope",
      tone: "urgent",
      subjectName: registration.attendeeName,
      urgencyLabel: `سجّلت ${formatElapsedLabel(new Date(registration.createdAt).getTime(), now)}`,
      context: `تسجيل جديد في «${registration.eventTitle}» — ${formatRelativeEventDay(registration.eventStartsAt, now)} ${formatArabicEventTimeRange(registration.eventStartsAt)}. يحتاج تأكيد واتساب.`,
      actions: [
        {
          kind: "link",
          variant: "primary",
          label: "فتح مساحة التواصل",
          href: `/admin/events?event=${event?.id ?? registration.eventId}#event-section-communications`,
        },
      ],
      deadline,
    });
  }

  // Unpaid, upcoming, priced registrations — one card per guest, each with its own precise
  // destination to record the payment, rather than one uncountable aggregate.
  for (const registration of registrations) {
    if (registration.status !== "registered" || registration.paymentStatus !== "unpaid" || registration.priceHalalasAtBooking <= 0) continue;
    if (new Date(registration.eventStartsAt).getTime() < now) continue;
    const deadline = new Date(registration.eventStartsAt).getTime();
    items.push({
      id: `payment-${registration.id}`,
      icon: "card",
      tone: "neutral",
      subjectName: registration.attendeeName,
      urgencyLabel: "دفعة معلّقة",
      context: `لم تُستكمل دفعة «${registration.eventTitle}» — ${formatRelativeEventDay(registration.eventStartsAt, now)} ${formatArabicEventTimeRange(registration.eventStartsAt)}.`,
      actions: [
        { kind: "link", variant: "primary", label: "متابعة الدفع", href: `/admin/registrations?view=upcoming&id=${registration.id}` },
      ],
      deadline,
    });
  }

  items.sort((first, second) => first.deadline - second.deadline);
  return items;
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
