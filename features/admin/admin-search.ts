import type { AdminServiceRequest, Event } from "@/lib/domain/types";

export function requestTitle(request: Pick<AdminServiceRequest, "kind" | "workshopTitle" | "useOrOccasionType">): string {
  return request.kind === "workshop_application" ? request.workshopTitle || "طلب ورشة" : request.useOrOccasionType || "طلب حجز مساحة";
}

export function matchEvents(events: readonly Event[], query: string, limit: number): Event[] {
  const normalizedQuery = query.toLowerCase();
  return events
    .filter((event) => event.title.toLowerCase().includes(normalizedQuery) || event.eventTypeLabel.toLowerCase().includes(normalizedQuery))
    .slice(0, limit);
}

export function matchRequests(requests: readonly AdminServiceRequest[], query: string, limit: number): AdminServiceRequest[] {
  const normalizedQuery = query.toLowerCase();
  return requests
    .filter(
      (request) =>
        request.requesterName.toLowerCase().includes(normalizedQuery) ||
        requestTitle(request).toLowerCase().includes(normalizedQuery) ||
        request.reference.toLowerCase().includes(normalizedQuery) ||
        request.phoneE164.includes(query),
    )
    .slice(0, limit);
}
