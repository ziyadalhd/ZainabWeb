export type EntityId = string;
export type IsoDateTime = string;
export type Rating = 1 | 2 | 3 | 4 | 5;
export type EventAudience = "adults" | "youth" | "children";
export type EventAvailability = "available" | "full";
export type AttendanceStatus = "pending" | "confirmed" | "cancelled";

export interface Event {
  id: EntityId;
  title: string;
  audience: EventAudience;
  eventTypeLabel: string;
  startsAt: IsoDateTime;
  capacity: number;
  registrationCount: number;
  attendanceConfirmedCount: number;
  waitlistCount: number;
  availability: EventAvailability;
}

export interface Registration {
  id: EntityId;
  eventId: EntityId;
  displayLabel: string;
  recordKind: "current" | "previous";
  attendanceStatus: AttendanceStatus;
}

export interface WaitlistEntry {
  id: EntityId;
  eventId: EntityId;
  displayLabel: string;
}

export interface InterestedContact {
  id: EntityId;
}

export interface Message {
  id: EntityId;
}

export interface SurveyResponse {
  kind: "event-feedback";
  hospitalityRating: Rating;
  materialRating: Rating;
  suggestions: string;
}

export interface AdminDashboardSnapshot {
  events: readonly Event[];
  registrations: readonly Registration[];
  waitlistEntries: readonly WaitlistEntry[];
}
