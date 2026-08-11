import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminRegistrationRepository,
  RegistrationService,
} from "@/lib/data/contracts";
import {
  isRegistrationAttendanceStatus,
  isRegistrationCheckInStatus,
  isRegistrationStatus,
} from "@/lib/domain/registration-input";
import type {
  BookingDetails,
  Registration,
  RegistrationInput,
  RegistrationReceipt,
  RegistrationReminderReceipt,
  WaitlistInvitationDetails,
  WaitlistInvitationReceipt,
} from "@/lib/domain/types";
import {
  generateSecureToken,
  hashSecureToken,
  isSecureToken,
} from "@/lib/security/secure-token";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RegistrationRow = Database["public"]["Tables"]["registrations"]["Row"];
type ReminderRow = Database["public"]["Tables"]["registration_reminders"]["Row"];
type RegisterRpcArgs = Database["public"]["Functions"]["register_for_event"]["Args"];

export type RegistrationFailureCode =
  | "duplicate"
  | "unavailable"
  | "capacity"
  | "invalid"
  | "save";

export class RegistrationFailure extends Error {
  constructor(readonly code: RegistrationFailureCode) {
    super(code);
  }
}

function mapFailure(message: string): RegistrationFailure {
  if (message === "duplicate_registration") return new RegistrationFailure("duplicate");
  if (
    message === "event_unavailable"
    || message === "booking_unavailable"
    || message === "invitation_unavailable"
  ) return new RegistrationFailure("unavailable");
  if (message === "event_capacity_reached") return new RegistrationFailure("capacity");
  if (
    message === "invalid_registration"
    || message === "minor_registration_invalid"
    || message === "invalid_invitation_token"
  ) {
    return new RegistrationFailure("invalid");
  }
  return new RegistrationFailure("save");
}

function mapRegistration(
  row: RegistrationRow,
  event: { title: string; startsAt: string } | undefined,
  latestReminder: ReminderRow | undefined,
): Registration {
  if (
    !isRegistrationStatus(row.status)
    || !isRegistrationAttendanceStatus(row.attendance_status)
    || !isRegistrationCheckInStatus(row.check_in_status)
  ) {
    throw new Error("Invalid registration row returned by the data source.");
  }

  return {
    id: row.id,
    reference: row.public_reference,
    eventId: row.event_id,
    eventTitle: event?.title ?? "فعالية غير متاحة",
    eventStartsAt: event?.startsAt ?? row.created_at,
    attendeeName: row.attendee_name,
    phoneE164: row.phone_e164,
    email: row.email,
    participantAge: row.participant_age,
    guardianName: row.guardian_name,
    guardianConsent: row.guardian_consent,
    priceHalalasAtBooking: row.price_halalas_at_booking,
    status: row.status,
    attendanceStatus: row.attendance_status,
    checkInStatus: row.check_in_status,
    checkedInAt: row.checked_in_at,
    invitationExpiresAt: row.invitation_expires_at,
    latestReminderPreparedAt: latestReminder?.prepared_at ?? null,
    latestReminderSentAt: latestReminder?.sent_at ?? null,
    createdAt: row.created_at,
  };
}

export class SupabaseRegistrationRepository
implements RegistrationService, AdminRegistrationRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async register(eventId: string, input: RegistrationInput): Promise<RegistrationReceipt> {
    const managementToken = generateSecureToken();
    const args = {
      p_event_id: eventId,
      p_attendee_name: input.attendeeName,
      p_phone_e164: input.phoneE164,
      p_email: input.email ?? "",
      p_guardian_name: input.guardianName,
      p_participant_age: input.participantAge,
      p_guardian_consent: input.guardianConsent,
      p_booking_token_hash: hashSecureToken(managementToken),
    } as unknown as RegisterRpcArgs;
    const { data, error } = await this.client.rpc("register_for_event", {
      ...args,
    });

    if (error) throw mapFailure(error.message);
    const receipt = data[0];
    if (!receipt || !isRegistrationStatus(receipt.registration_status)) {
      throw new RegistrationFailure("save");
    }
    return {
      reference: receipt.registration_reference,
      status: receipt.registration_status,
      managementToken,
    };
  }

  async getBooking(token: string): Promise<BookingDetails | null> {
    if (!isSecureToken(token)) return null;
    const { data, error } = await this.client.rpc("get_booking_by_token", {
      p_booking_token_hash: hashSecureToken(token),
    });
    if (error) throw mapFailure(error.message);
    const booking = data[0];
    if (!booking) return null;
    if (
      !isRegistrationStatus(booking.registration_status)
      || !isRegistrationAttendanceStatus(booking.attendance_status)
    ) {
      throw new RegistrationFailure("save");
    }
    return {
      attendeeName: booking.attendee_name,
      eventTitle: booking.event_title,
      eventStartsAt: booking.event_starts_at,
      eventEndsAt: booking.event_ends_at,
      status: booking.registration_status,
      attendanceStatus: booking.attendance_status,
      priceHalalasAtBooking: booking.price_halalas_at_booking,
    };
  }

  async cancelBooking(token: string): Promise<void> {
    if (!isSecureToken(token)) throw new RegistrationFailure("unavailable");
    const { error } = await this.client.rpc("cancel_booking_by_token", {
      p_booking_token_hash: hashSecureToken(token),
    });
    if (error) throw mapFailure(error.message);
  }

  async confirmBookingAttendance(token: string): Promise<void> {
    if (!isSecureToken(token)) throw new RegistrationFailure("unavailable");
    const { error } = await this.client.rpc("confirm_booking_attendance_by_token", {
      p_booking_token_hash: hashSecureToken(token),
    });
    if (error) throw mapFailure(error.message);
  }

  async getWaitlistInvitation(token: string): Promise<WaitlistInvitationDetails | null> {
    if (!isSecureToken(token)) return null;
    const { data, error } = await this.client.rpc("get_waitlist_invitation", {
      p_invitation_token_hash: hashSecureToken(token),
    });
    if (error) throw mapFailure(error.message);
    const invitation = data[0];
    return invitation ? {
      attendeeName: invitation.attendee_name,
      eventTitle: invitation.event_title,
      eventStartsAt: invitation.event_starts_at,
      expiresAt: invitation.invitation_expires_at,
    } : null;
  }

  async acceptWaitlistInvitation(token: string): Promise<void> {
    if (!isSecureToken(token)) throw new RegistrationFailure("unavailable");
    const { error } = await this.client.rpc("accept_waitlist_invitation", {
      p_invitation_token_hash: hashSecureToken(token),
    });
    if (error) throw mapFailure(error.message);
  }

  async list(): Promise<readonly Registration[]> {
    const [
      { data: registrations, error },
      { data: events, error: eventsError },
      { data: reminders, error: remindersError },
    ] = await Promise.all([
      this.client.from("registrations").select("*").order("created_at", { ascending: false }),
      this.client.from("events").select("id,title,starts_at"),
      this.client.from("registration_reminders").select("*").order("prepared_at", { ascending: false }),
    ]);
    if (error || eventsError || remindersError || !registrations || !events || !reminders) {
      throw new RegistrationFailure("save");
    }
    const eventDetails = new Map(events.map((event) => [
      event.id,
      { title: event.title, startsAt: event.starts_at },
    ]));
    const latestReminders = new Map<string, ReminderRow>();
    for (const reminder of reminders) {
      if (!latestReminders.has(reminder.registration_id)) {
        latestReminders.set(reminder.registration_id, reminder);
      }
    }
    return registrations.map((row) => mapRegistration(
      row,
      eventDetails.get(row.event_id),
      latestReminders.get(row.id),
    ));
  }

  async cancel(id: string): Promise<void> {
    const { error } = await this.client.rpc("cancel_registration", { p_registration_id: id });
    if (error) throw mapFailure(error.message);
  }

  async invite(id: string): Promise<WaitlistInvitationReceipt> {
    const token = generateSecureToken();
    const { data, error } = await this.client.rpc("invite_waitlisted_registration", {
      p_registration_id: id,
      p_invitation_token_hash: hashSecureToken(token),
    });
    if (error) throw mapFailure(error.message);
    return { token, expiresAt: data };
  }

  async revokeInvitation(id: string): Promise<void> {
    const { error } = await this.client.rpc("revoke_waitlist_invitation", {
      p_registration_id: id,
    });
    if (error) throw mapFailure(error.message);
  }

  async confirmAttendance(id: string): Promise<void> {
    const { error } = await this.client.rpc("confirm_registration_attendance", { p_registration_id: id });
    if (error) throw mapFailure(error.message);
  }

  async recordCheckIn(id: string, outcome: "checked_in" | "absent"): Promise<void> {
    const { error } = await this.client.rpc("record_registration_check_in", {
      p_registration_id: id,
      p_check_in_status: outcome,
    });
    if (error) throw mapFailure(error.message);
  }

  async issueReminder(id: string): Promise<RegistrationReminderReceipt> {
    const managementToken = generateSecureToken();
    const { data, error } = await this.client.rpc("issue_registration_reminder", {
      p_registration_id: id,
      p_management_token_hash: hashSecureToken(managementToken),
    });
    if (error || !data) throw mapFailure(error?.message ?? "save");
    return { id: data, managementToken };
  }

  async markReminderSent(id: string): Promise<void> {
    const { error } = await this.client.rpc("mark_registration_reminder_sent", {
      p_reminder_id: id,
    });
    if (error) throw mapFailure(error.message);
  }
}

export async function createRegistrationService(): Promise<RegistrationService> {
  return new SupabaseRegistrationRepository(await createSupabaseServerClient());
}

export async function createAdminRegistrationRepository(): Promise<AdminRegistrationRepository> {
  return new SupabaseRegistrationRepository(await createSupabaseServerClient());
}
