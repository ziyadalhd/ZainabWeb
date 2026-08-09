export type EntityId = string;
export type IsoDateTime = string;
export type Rating = 1 | 2 | 3 | 4 | 5;
export type EventAudience = "adults" | "youth" | "children";
export type EventRegistrationStatus = "open" | "closed";
export type EventAvailability = "available" | "full" | "closed";
export type EventPublicationStatus = "draft" | "published" | "archived";
export type RegistrationStatus = "registered" | "waitlisted" | "invited" | "cancelled";
export type RegistrationAttendanceStatus = "pending" | "confirmed";

export interface Event {
  id: EntityId;
  title: string;
  audience: EventAudience;
  eventTypeLabel: string;
  startsAt: IsoDateTime;
  endsAt: IsoDateTime | null;
  capacity: number;
  activeReservationCount: number;
  priceHalalas: number | null;
  registrationStatus: EventRegistrationStatus;
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
  endsAt: IsoDateTime;
  capacity: number;
  priceHalalas: number;
  registrationStatus: EventRegistrationStatus;
}

export interface RegistrationInput {
  attendeeName: string;
  phoneE164: string;
  email: string | null;
  participantAge: number | null;
  guardianName: string | null;
  guardianConsent: boolean;
}

export interface RegistrationReceipt {
  reference: EntityId;
  status: RegistrationStatus;
  managementToken: string;
}

export interface Registration {
  id: EntityId;
  reference: EntityId;
  eventId: EntityId;
  eventTitle: string;
  eventStartsAt: IsoDateTime;
  attendeeName: string;
  phoneE164: string;
  email: string | null;
  participantAge: number | null;
  guardianName: string | null;
  guardianConsent: boolean;
  priceHalalasAtBooking: number;
  status: RegistrationStatus;
  attendanceStatus: RegistrationAttendanceStatus;
  invitationExpiresAt: IsoDateTime | null;
  createdAt: IsoDateTime;
}

export interface WaitlistInvitationReceipt {
  token: string;
  expiresAt: IsoDateTime;
}

export interface WaitlistInvitationDetails {
  attendeeName: string;
  eventTitle: string;
  eventStartsAt: IsoDateTime;
  expiresAt: IsoDateTime;
}

export interface BookingDetails {
  attendeeName: string;
  eventTitle: string;
  eventStartsAt: IsoDateTime;
  eventEndsAt: IsoDateTime;
  status: RegistrationStatus;
  attendanceStatus: RegistrationAttendanceStatus;
  priceHalalasAtBooking: number;
}

export interface SurveyResponse {
  kind: "event-feedback";
  hospitalityRating: Rating;
  materialRating: Rating;
  suggestions: string;
}
