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
} from "@/lib/domain/types";
import type { RepositoryResult } from "@/lib/data/result";

export interface EventCatalog {
  listUpcomingEvents(): Promise<readonly Event[]>;
  listUpcomingBaynTrips(): Promise<readonly Event[]>;
  getUpcomingEvent(id: string): Promise<Event | null>;
}

/**
 * Why deletion can fail without being an error:
 * - `not-found` — no such event, or it was already deleted.
 * - `has-attendees` — someone has registered for it, or it collected feedback. Both foreign keys
 *   are `on delete restrict`, so the database refuses the delete. Per AGENTS.md §263 an event with
 *   attendee history is cancelled, never hard-deleted; the caller should say so rather than retry.
 */
export type DeleteEventOutcome =
  | { deleted: true; posterPath: string | null }
  | { deleted: false; reason: "not-found" | "has-attendees" };

export interface AdminEventRepository {
  list(): Promise<RepositoryResult<readonly Event[]>>;
  get(id: string): Promise<Event | null>;
  create(input: EventInput): Promise<Event>;
  update(id: string, input: EventInput): Promise<Event>;
  duplicate(id: string): Promise<Event>;
  changeStatus(id: string, status: EventPublicationStatus): Promise<Event>;
  setPosterPath(id: string, posterPath: string): Promise<void>;
  /** Hard-deletes an event. Returns the poster path (if any) so the caller can clean up storage. */
  delete(id: string): Promise<DeleteEventOutcome>;
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
  list(): Promise<RepositoryResult<readonly Registration[]>>;
  listForEvent(eventId: string): Promise<RepositoryResult<readonly Registration[]>>;
  listPage(filter: AdminRegistrationListFilter): Promise<RepositoryResult<PaginatedResult<Registration>>>;
  listManualMessagesForEvent(eventId: string): Promise<RepositoryResult<readonly ManualMessageRecord[]>>;
  prepareManualMessage(id: string, kind: ManualMessageKind): Promise<ManualMessageReceipt>;
  markManualMessageSent(id: string): Promise<IsoDateTime>;
  cancel(id: string): Promise<void>;
  invite(id: string): Promise<WaitlistInvitationReceipt>;
  revokeInvitation(id: string): Promise<void>;
  confirmInvitation(id: string): Promise<void>;
  confirmAttendance(id: string): Promise<void>;
  recordCheckIn(id: string, outcome: "checked_in" | "absent"): Promise<void>;
  setPaymentStatus(id: string, status: RegistrationPaymentStatus): Promise<void>;
}

export interface InterestedContactService {
  submit(input: InterestedContactInput): Promise<InterestedContactReceipt>;
  unsubscribe(token: string): Promise<void>;
}

export interface AdminInterestedContactRepository {
  list(): Promise<RepositoryResult<readonly AdminInterestedContact[]>>;
}

export interface EventFeedbackService {
  getByToken(token: string): Promise<EventFeedbackSurvey | null>;
  submitByToken(token: string, input: EventFeedbackInput): Promise<void>;
}

export interface AdminEventFeedbackRepository {
  listSubmitted(): Promise<RepositoryResult<readonly AdminEventFeedbackResponse[]>>;
  listSubmittedForEvent(eventId: string): Promise<RepositoryResult<readonly AdminEventFeedbackResponse[]>>;
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
}

export interface AdminServiceRequestRepository {
  list(): Promise<RepositoryResult<readonly AdminServiceRequest[]>>;
  listPage(filter: AdminServiceRequestListFilter): Promise<RepositoryResult<PaginatedResult<AdminServiceRequest>>>;
  getConflicts(id: string): Promise<RepositoryResult<readonly ServiceRequestConflict[]>>;
  markContacted(id: string): Promise<void>;
}
