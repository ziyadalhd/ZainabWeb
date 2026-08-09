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
} from "@/lib/domain/types";

export interface EventCatalog {
  listUpcomingEvents(): Promise<readonly Event[]>;
  getUpcomingEvent(id: string): Promise<Event | null>;
}

export interface AdminEventRepository {
  list(): Promise<readonly Event[]>;
  get(id: string): Promise<Event | null>;
  create(input: EventInput): Promise<Event>;
  update(id: string, input: EventInput): Promise<Event>;
  changeStatus(id: string, status: EventPublicationStatus): Promise<Event>;
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
}
