import { eventLifecycle, type EventLifecycle } from "@/features/admin/event-lifecycle";
import type { Event, EventAudience } from "@/lib/domain/types";

export type EventStatusFilter = "all" | "upcoming" | "live" | "draft" | "past" | "archived";
export type EventAudienceFilter = "all" | EventAudience;

const statusFilters: readonly EventStatusFilter[] = ["all", "upcoming", "live", "draft", "past", "archived"];
const audienceFilters: readonly EventAudienceFilter[] = ["all", "adults", "youth", "children"];

export const defaultEventStatusFilter: EventStatusFilter = "upcoming";
export const defaultEventAudienceFilter: EventAudienceFilter = "all";

export function parseEventStatusFilter(value: string | undefined): EventStatusFilter {
  return statusFilters.includes(value as EventStatusFilter) ? (value as EventStatusFilter) : defaultEventStatusFilter;
}

export function parseEventAudienceFilter(value: string | undefined): EventAudienceFilter {
  return audienceFilters.includes(value as EventAudienceFilter) ? (value as EventAudienceFilter) : defaultEventAudienceFilter;
}

/** Groups the fine-grained lifecycle into the coarser buckets the status filter offers; cancelled events surface under "past". */
function matchesStatusFilter(lifecycle: EventLifecycle, filter: EventStatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "past") return lifecycle === "past" || lifecycle === "cancelled";
  return lifecycle === filter;
}

function matchesAudienceFilter(event: Event, filter: EventAudienceFilter): boolean {
  return filter === "all" || event.audience === filter;
}

function matchesQuery(event: Event, query: string): boolean {
  if (!query) return true;
  const normalized = query.toLowerCase();
  return event.title.toLowerCase().includes(normalized) || event.eventTypeLabel.toLowerCase().includes(normalized);
}

export function filterEvents(
  events: readonly Event[],
  options: { status: EventStatusFilter; audience: EventAudienceFilter; query: string; now: Date },
): Event[] {
  const normalizedQuery = options.query.trim();
  return events.filter((event) => {
    const lifecycle = eventLifecycle(event, options.now);
    return (
      matchesStatusFilter(lifecycle, options.status) &&
      matchesAudienceFilter(event, options.audience) &&
      matchesQuery(event, normalizedQuery)
    );
  });
}

export function countEventsByStatus(events: readonly Event[], now: Date): Record<EventStatusFilter, number> {
  const counts: Record<EventStatusFilter, number> = { all: events.length, upcoming: 0, live: 0, draft: 0, past: 0, archived: 0 };
  for (const event of events) {
    const lifecycle = eventLifecycle(event, now);
    for (const filter of statusFilters) {
      if (filter !== "all" && matchesStatusFilter(lifecycle, filter)) counts[filter] += 1;
    }
  }
  return counts;
}
