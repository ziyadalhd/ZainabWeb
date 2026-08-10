export type EntityId = string;
export type IsoDateTime = string;
export type Rating = 1 | 2 | 3 | 4 | 5;
export type EventAudience = "adults" | "youth" | "children";
export type EventRegistrationStatus = "open" | "closed";
export type EventAvailability = "available" | "full" | "closed";
export type EventPublicationStatus = "draft" | "published" | "archived";
export type RegistrationStatus = "registered" | "waitlisted" | "invited" | "cancelled";
export type RegistrationAttendanceStatus = "pending" | "confirmed";
export type RegistrationCheckInStatus = "pending" | "checked_in" | "absent";
export type ServiceRequestKind = "space_booking" | "celebration_booking" | "workshop_application";
export type ServiceRequestStatus = "new" | "under_review" | "accepted" | "rejected" | "cancelled";

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
  checkInStatus: RegistrationCheckInStatus;
  checkedInAt: IsoDateTime | null;
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

export interface ServiceRequestInput {
  requesterName: string;
  phoneE164: string;
  email: string | null;
  notes: string | null;
  booking: {
    useOrOccasionType: string;
    requestedDate: string;
    requestedStartTime: string;
    requestedEndTime: string;
    attendeeCount: number;
  } | null;
  workshop: {
    title: string;
    description: string;
    targetAudience: string;
    duration: string;
    expectedAttendance: number;
    requirements: string;
    portfolioUrl: string | null;
  } | null;
}

export interface ServiceRequestReceipt {
  reference: EntityId;
  managementToken: string;
}

export interface ServiceRequestDetails {
  kind: ServiceRequestKind;
  requesterName: string;
  status: ServiceRequestStatus;
  useOrOccasionType: string | null;
  requestedDate: string | null;
  requestedStartTime: string | null;
  requestedEndTime: string | null;
  attendeeCount: number | null;
  workshopTitle: string | null;
  workshopDescription: string | null;
  workshopTargetAudience: string | null;
  workshopDuration: string | null;
  workshopExpectedAttendance: number | null;
  workshopRequirements: string | null;
  workshopPortfolioUrl: string | null;
  notes: string | null;
  offerPriceHalalas: number | null;
  offerTerms: string | null;
  offerExpiresAt: string | null;
}

export interface AdminServiceRequest {
  id: EntityId;
  reference: EntityId;
  kind: ServiceRequestKind;
  requesterName: string;
  phoneE164: string;
  email: string | null;
  status: ServiceRequestStatus;
  requestedDate: string | null;
  requestedStartTime: string | null;
  requestedEndTime: string | null;
  attendeeCount: number | null;
  useOrOccasionType: string | null;
  workshopTitle: string | null;
  createdAt: IsoDateTime;
}
