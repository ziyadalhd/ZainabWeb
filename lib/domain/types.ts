export type EntityId = string;
export type IsoDateTime = string;
export type Rating = 1 | 2 | 3 | 4 | 5;
export type EventAudience = "adults" | "youth" | "children";
export type EventAvailability = "available" | "full";
export type EventPublicationStatus = "draft" | "published" | "archived";

export interface Event {
  id: EntityId;
  title: string;
  audience: EventAudience;
  eventTypeLabel: string;
  startsAt: IsoDateTime;
  capacity: number;
  availability: EventAvailability;
  publicationStatus: EventPublicationStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface EventInput {
  title: string;
  audience: EventAudience;
  eventTypeLabel: string;
  startsAt: IsoDateTime;
  capacity: number;
  availability: EventAvailability;
}

export interface SurveyResponse {
  kind: "event-feedback";
  hospitalityRating: Rating;
  materialRating: Rating;
  suggestions: string;
}
