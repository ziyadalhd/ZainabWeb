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
  ManualMessageKind,
  ManualMessageReceipt,
  ManualMessageRecord,
  IsoDateTime,
  RegistrationPaymentStatus,
  InterestedContactInput,
  InterestedContactReceipt,
  AdminInterestedContact,
  AdminRegistrationListFilter,
  PaginatedResult,
  EventFeedbackSurvey,
  EventFeedbackInput,
  AdminEventFeedbackResponse,
  SiteSettings,
  SiteSettingsInput,
  AdminServiceRequest,
  AdminServiceRequestListFilter,
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
  listForEvent(eventId: string): Promise<readonly Registration[]>;
  listPage(filter: AdminRegistrationListFilter): Promise<PaginatedResult<Registration>>;
  listManualMessagesForEvent(eventId: string): Promise<readonly ManualMessageRecord[]>;
  prepareManualMessage(id: string, kind: ManualMessageKind): Promise<ManualMessageReceipt>;
  markManualMessageSent(id: string): Promise<IsoDateTime>;
  cancel(id: string): Promise<void>;
  invite(id: string): Promise<WaitlistInvitationReceipt>;
  revokeInvitation(id: string): Promise<void>;
  confirmAttendance(id: string): Promise<void>;
  recordCheckIn(id: string, outcome: "checked_in" | "absent"): Promise<void>;
  setPaymentStatus(id: string, status: RegistrationPaymentStatus): Promise<void>;
}

export interface InterestedContactService {
  submit(input: InterestedContactInput): Promise<InterestedContactReceipt>;
  unsubscribe(token: string): Promise<void>;
}

export interface AdminInterestedContactRepository {
  list(): Promise<readonly AdminInterestedContact[]>;
}

export interface EventFeedbackService {
  getByToken(token: string): Promise<EventFeedbackSurvey | null>;
  submitByToken(token: string, input: EventFeedbackInput): Promise<void>;
}

export interface AdminEventFeedbackRepository {
  listSubmitted(): Promise<readonly AdminEventFeedbackResponse[]>;
  listSubmittedForEvent(eventId: string): Promise<readonly AdminEventFeedbackResponse[]>;
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
  listPage(filter: AdminServiceRequestListFilter): Promise<PaginatedResult<AdminServiceRequest>>;
  startReview(id: string): Promise<void>;
  createOffer(id: string, priceHalalas: number, terms: string, expiresAt: string | null): Promise<void>;
  setPaymentStatus(id: string, status: ServiceRequestPaymentStatus): Promise<void>;
  getConflicts(id: string): Promise<readonly ServiceRequestConflict[]>;
  markContacted(id: string): Promise<void>;
}
