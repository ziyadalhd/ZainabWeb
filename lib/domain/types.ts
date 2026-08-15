export type EntityId = string;
export type IsoDateTime = string;
export type Rating = 1 | 2 | 3 | 4 | 5;
export type EventAudience = "adults" | "youth" | "children";
export type EventKind = "club_event" | "bayn_trip";
export type EventRegistrationStatus = "open" | "closed";
export type EventAvailability = "available" | "full" | "closed";
export type EventPublicationStatus = "draft" | "published" | "archived";
export type RegistrationStatus = "registered" | "waitlisted" | "invited" | "cancelled";
export type RegistrationAttendanceStatus = "pending" | "confirmed";
export type RegistrationCheckInStatus = "pending" | "checked_in" | "absent";
export type RegistrationPaymentStatus = "unpaid" | "deposit_paid" | "paid_in_full";
export type ServiceRequestKind = "space_booking" | "celebration_booking" | "workshop_application";
export type ServiceRequestStatus = "new" | "under_review" | "accepted" | "rejected" | "cancelled";
export type ServiceRequestPaymentStatus = "unpaid" | "deposit_paid" | "paid_in_full";

export interface Event {
  id: EntityId;
  title: string;
  kind: EventKind;
  audience: EventAudience;
  eventTypeLabel: string;
  startsAt: IsoDateTime;
  endsAt: IsoDateTime | null;
  capacity: number;
  activeReservationCount: number;
  priceHalalas: number | null;
  posterUrl: string | null;
  registrationStatus: EventRegistrationStatus;
  availability: EventAvailability;
  publicationStatus: EventPublicationStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface EventInput {
  title: string;
  kind: EventKind;
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
  paymentStatus: RegistrationPaymentStatus;
  invitationExpiresAt: IsoDateTime | null;
  latestReminderPreparedAt: IsoDateTime | null;
  latestReminderSentAt: IsoDateTime | null;
  createdAt: IsoDateTime;
}

export interface RegistrationReminderReceipt {
  id: EntityId;
  managementToken: string;
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

export interface EventFeedbackInput {
  hospitalityRating: Rating;
  materialRating: Rating;
  suggestions: string | null;
  identityVisible: boolean;
}

export interface EventFeedbackSurvey {
  eventTitle: string;
}

export interface InterestedContactInput {
  contactName: string;
  phoneE164: string;
  email: string;
}

export interface InterestedContactReceipt {
  unsubscribeToken: string;
}

export interface AdminInterestedContact {
  id: EntityId;
  contactName: string;
  phoneE164: string;
  email: string;
  consentedAt: IsoDateTime;
  unsubscribedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
}

export interface EventFeedbackLinkReceipt {
  id: EntityId;
  token: string;
}

export interface AdminEventFeedbackResponse {
  id: EntityId;
  eventTitle: string;
  attendeeName: string | null;
  hospitalityRating: Rating;
  materialRating: Rating;
  suggestions: string | null;
  submittedAt: IsoDateTime;
}

export interface SiteSettings {
  clubIntroduction: string | null;
  nameStory: string | null;
  objectives: string | null;
  contactPhone: string | null;
  defaultVenueName: string | null;
  defaultVenueAddress: string | null;
  defaultVenueMapUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  literaryPartnerTitle: string | null;
  literaryPartnerBody: string | null;
  updatedAt: IsoDateTime;
}

export type SiteSettingsInput = Omit<SiteSettings, "updatedAt">;

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
  notes: string | null;
  offerPriceHalalas: number | null;
  offerTerms: string | null;
  offerExpiresAt: IsoDateTime | null;
  paymentStatus: ServiceRequestPaymentStatus;
  createdAt: IsoDateTime;
}

export interface ServiceRequestConflict {
  source: "event" | "service_request";
  title: string;
  startsAt: IsoDateTime;
  endsAt: IsoDateTime;
  status: string;
}
