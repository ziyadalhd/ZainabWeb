import type {
  Event,
  EventInput,
  EventPublicationStatus,
  BookingDetails,
  Registration,
  RegistrationInput,
  RegistrationReceipt,
  WaitlistInvitationDetails,
  WaitlistInvitationReceipt,
  RegistrationReminderReceipt,
  EventFeedbackLinkReceipt,
  EventFeedbackSurvey,
  EventFeedbackInput,
  AdminEventFeedbackResponse,
  SiteSettings,
  SiteSettingsInput,
  AdminServiceRequest,
  ServiceRequestInput,
  ServiceRequestKind,
  ServiceRequestReceipt,
  ServiceRequestDetails,
  ServiceRequestConflict,
  ServiceRequestPaymentStatus,
} from "@/lib/domain/types";

export interface EventCatalog {
  listUpcomingEvents(): Promise<readonly Event[]>;
  listUpcomingBaynTrips(): Promise<readonly Event[]>;
  getUpcomingEvent(id: string): Promise<Event | null>;
}

export interface AdminEventRepository {
  list(): Promise<readonly Event[]>;
  get(id: string): Promise<Event | null>;
  create(input: EventInput): Promise<Event>;
  update(id: string, input: EventInput): Promise<Event>;
  changeStatus(id: string, status: EventPublicationStatus): Promise<Event>;
  setPosterPath(id: string, posterPath: string): Promise<void>;
}

export interface RegistrationService {
  register(eventId: string, input: RegistrationInput): Promise<RegistrationReceipt>;
  getBooking(token: string): Promise<BookingDetails | null>;
  cancelBooking(token: string): Promise<void>;
  confirmBookingAttendance(token: string): Promise<void>;
  getWaitlistInvitation(token: string): Promise<WaitlistInvitationDetails | null>;
  acceptWaitlistInvitation(token: string): Promise<void>;
}

export interface AdminRegistrationRepository {
  list(): Promise<readonly Registration[]>;
  cancel(id: string): Promise<void>;
  invite(id: string): Promise<WaitlistInvitationReceipt>;
  revokeInvitation(id: string): Promise<void>;
  confirmAttendance(id: string): Promise<void>;
  recordCheckIn(id: string, outcome: "checked_in" | "absent"): Promise<void>;
  issueReminder(id: string): Promise<RegistrationReminderReceipt>;
  markReminderSent(id: string): Promise<void>;
  issueEventFeedbackLink(id: string): Promise<EventFeedbackLinkReceipt>;
}

export interface EventFeedbackService {
  getByToken(token: string): Promise<EventFeedbackSurvey | null>;
  submitByToken(token: string, input: EventFeedbackInput): Promise<void>;
}

export interface AdminEventFeedbackRepository {
  listSubmitted(): Promise<readonly AdminEventFeedbackResponse[]>;
}

export interface SiteSettingsRepository {
  get(): Promise<SiteSettings>;
}

export interface AdminSiteSettingsRepository extends SiteSettingsRepository {
  update(input: SiteSettingsInput): Promise<void>;
}

export interface ServiceRequestService {
  submit(kind: ServiceRequestKind, input: ServiceRequestInput): Promise<ServiceRequestReceipt>;
  getByToken(token: string): Promise<ServiceRequestDetails | null>;
  cancelByToken(token: string): Promise<void>;
  respondToOfferByToken(token: string, response: "accepted" | "rejected"): Promise<void>;
}

export interface AdminServiceRequestRepository {
  list(): Promise<readonly AdminServiceRequest[]>;
  startReview(id: string): Promise<void>;
  createOffer(id: string, priceHalalas: number, terms: string, expiresAt: string | null): Promise<void>;
  setPaymentStatus(id: string, status: ServiceRequestPaymentStatus): Promise<void>;
  getConflicts(id: string): Promise<readonly ServiceRequestConflict[]>;
}
