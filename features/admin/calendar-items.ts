import type { AdminServiceRequest, Event, ServiceRequestStatus } from "@/lib/domain/types";

export type CalendarItemKind = "event" | "request" | "booking";

export interface CalendarItem {
  id: string;
  kind: CalendarItemKind;
  title: string;
  startsAt: string;
  endsAt: string | null;
  href: string;
  status: string;
  conflictCount: number;
}

const scheduledRequestStatuses: readonly ServiceRequestStatus[] = ["new", "under_review", "accepted"];

function requestDateTime(date: string | null, time: string | null): string | null {
  if (!date || !time || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}(?::\d{2})?$/.test(time)) return null;
  return `${date}T${time.slice(0, 5)}:00+03:00`;
}

function overlaps(first: CalendarItem, second: CalendarItem): boolean {
  if (!first.endsAt || !second.endsAt) return false;
  return new Date(first.startsAt).getTime() < new Date(second.endsAt).getTime()
    && new Date(second.startsAt).getTime() < new Date(first.endsAt).getTime();
}

export function buildCalendarItems(events: readonly Event[], requests: readonly AdminServiceRequest[]): readonly CalendarItem[] {
  const items: CalendarItem[] = [
    ...events.filter((event) => event.publicationStatus === "draft" || event.publicationStatus === "published").map((event) => ({
      id: `event-${event.id}`, kind: "event" as const, title: event.title, startsAt: event.startsAt, endsAt: event.endsAt,
      href: `/admin/events/${event.id}`, status: event.publicationStatus, conflictCount: 0,
    })),
    ...requests.filter((request) => request.kind !== "workshop_application" && scheduledRequestStatuses.includes(request.status)).flatMap((request) => {
      const startsAt = requestDateTime(request.requestedDate, request.requestedStartTime);
      const endsAt = requestDateTime(request.requestedDate, request.requestedEndTime);
      if (!startsAt || !endsAt || new Date(endsAt).getTime() <= new Date(startsAt).getTime()) return [];
      return [{
        id: `request-${request.id}`, kind: request.status === "accepted" ? "booking" as const : "request" as const,
        title: request.useOrOccasionType ?? "طلب حجز", startsAt, endsAt,
        href: `/admin/requests?id=${encodeURIComponent(request.id)}`, status: request.status, conflictCount: 0,
      }];
    }),
  ].sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime());

  return items.map((item) => ({ ...item, conflictCount: items.filter((candidate) => candidate.id !== item.id && overlaps(item, candidate)).length }));
}
