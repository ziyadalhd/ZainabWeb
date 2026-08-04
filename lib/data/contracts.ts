import type { Event, EventInput, EventPublicationStatus } from "@/lib/domain/types";

export interface EventCatalog {
  listUpcomingEvents(): Promise<readonly Event[]>;
}

export interface AdminEventRepository {
  list(): Promise<readonly Event[]>;
  get(id: string): Promise<Event | null>;
  create(input: EventInput): Promise<Event>;
  update(id: string, input: EventInput): Promise<Event>;
  changeStatus(id: string, status: EventPublicationStatus): Promise<Event>;
}
