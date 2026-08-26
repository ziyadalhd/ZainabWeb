import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminRegistrationRepository,
  RegistrationService,
} from "@/lib/data/contracts";
import {
  isRegistrationAttendanceStatus,
  isRegistrationCheckInStatus,
  isRegistrationPaymentStatus,
  isRegistrationStatus,
} from "@/lib/domain/registration-input";
import type {
  BookingDetails,
  Registration,
  RegistrationInput,
  RegistrationReceipt,
  RegistrationPaymentStatus,
  EventFeedbackLinkReceipt,
  ManualMessageKind,
  ManualMessageReceipt,
  ManualMessageRecord,
  AdminRegistrationListFilter,
  PaginatedResult,
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
import { isManualMessageKind } from "@/lib/messaging/manual-messages";
import { loadFailed, ok, type RepositoryResult } from "@/lib/data/result";
import { logRepositoryFailure } from "@/lib/observability/logger";

type RegistrationRow = Database["public"]["Tables"]["registrations"]["Row"];
type ReminderRow = Database["public"]["Tables"]["registration_reminders"]["Row"];
type ManualMessageRow = Database["public"]["Tables"]["manual_messages"]["Row"];
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
    || !isRegistrationPaymentStatus(row.payment_status)
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
    paymentStatus: row.payment_status,
    invitationExpiresAt: row.invitation_expires_at,
    latestReminderPreparedAt: latestReminder?.prepared_at ?? null,
    latestReminderSentAt: latestReminder?.sent_at ?? null,
    confirmationSentAt: row.confirmation_sent_at,
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

  async list(): Promise<RepositoryResult<readonly Registration[]>> {
    try {
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
        logRepositoryFailure("Registrations.list", error ?? eventsError ?? remindersError);
        return loadFailed();
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
      return ok(registrations.map((row) => mapRegistration(
        row,
        eventDetails.get(row.event_id),
        latestReminders.get(row.id),
      )));
    } catch (err) {
      logRepositoryFailure("Registrations.list", err);
      return loadFailed();
    }
  }

  async listForEvent(eventId: string): Promise<RepositoryResult<readonly Registration[]>> {
    try {
      const [{ data: event, error: eventError }, { data: registrations, error }] = await Promise.all([
        this.client.from("events").select("id,title,starts_at").eq("id", eventId).maybeSingle(),
        this.client.from("registrations").select("*").eq("event_id", eventId).order("created_at", { ascending: false }),
      ]);
      if (eventError || error || !event || !registrations) {
        logRepositoryFailure("Registrations.listForEvent", eventError ?? error);
        return loadFailed();
      }

      const registrationIds = registrations.map((registration) => registration.id);
      const { data: reminders, error: remindersError } = registrationIds.length
        ? await this.client.from("registration_reminders").select("*").in("registration_id", registrationIds).order("prepared_at", { ascending: false })
        : { data: [] as ReminderRow[], error: null };
      if (remindersError) {
        logRepositoryFailure("Registrations.listForEvent", remindersError);
        return loadFailed();
      }

      const latestReminders = new Map<string, ReminderRow>();
      for (const reminder of reminders ?? []) {
        if (!latestReminders.has(reminder.registration_id)) latestReminders.set(reminder.registration_id, reminder);
      }
      const eventDetails = { title: event.title, startsAt: event.starts_at };
      return ok(registrations.map((row) => mapRegistration(row, eventDetails, latestReminders.get(row.id))));
    } catch (error) {
      logRepositoryFailure("Registrations.listForEvent", error);
      return loadFailed();
    }
  }

  async listManualMessagesForEvent(eventId: string): Promise<RepositoryResult<readonly ManualMessageRecord[]>> {
    const { data: registrations, error: registrationsError } = await this.client
      .from("registrations")
      .select("id")
      .eq("event_id", eventId);
    if (registrationsError) {
      logRepositoryFailure("Registrations.listManualMessagesForEvent", registrationsError);
      return loadFailed();
    }
    if (!registrations?.length) return ok([]);

    const registrationIds = registrations.map((registration) => registration.id);
    const [
      { data, error },
      { data: legacyReminders, error: legacyError },
    ] = await Promise.all([
      this.client.from("manual_messages").select("*").in("registration_id", registrationIds).order("prepared_at", { ascending: false }),
      this.client.from("registration_reminders").select("*").in("registration_id", registrationIds).order("prepared_at", { ascending: false }),
    ]);
    if (error || legacyError || !data || !legacyReminders) {
      logRepositoryFailure("Registrations.listManualMessagesForEvent", error ?? legacyError);
      return loadFailed();
    }

    const currentMessages: ManualMessageRecord[] = data.flatMap((row: ManualMessageRow) => isManualMessageKind(row.message_kind) ? [{
      id: row.id,
      registrationId: row.registration_id,
      kind: row.message_kind,
      preparedAt: row.prepared_at,
      sentAt: row.sent_at,
      supersededAt: row.superseded_at,
    }] : []);
    const legacyMessages: ManualMessageRecord[] = legacyReminders.map((row: ReminderRow) => ({
      id: row.id,
      registrationId: row.registration_id,
      kind: "legacy_reminder",
      preparedAt: row.prepared_at,
      sentAt: row.sent_at,
      supersededAt: null,
    }));
    return ok([...currentMessages, ...legacyMessages].sort((first, second) => new Date(second.preparedAt).getTime() - new Date(first.preparedAt).getTime()));
  }

  async listPage(filter: AdminRegistrationListFilter): Promise<RepositoryResult<PaginatedResult<Registration>>> {
    const page = Math.max(1, Math.floor(filter.page));
    const pageSize = Math.min(100, Math.max(1, Math.floor(filter.pageSize)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const searchTerm = filter.query.trim().replace(/[,%().]/g, "");
    const empty = () => ok<PaginatedResult<Registration>>({ items: [], total: 0, page, pageSize });

    try {
      let eventQuery = this.client.from("events").select("id,title,starts_at");
      if (filter.view === "upcoming") eventQuery = eventQuery.gte("starts_at", filter.now);
      if (filter.view === "previous") eventQuery = eventQuery.lt("starts_at", filter.now);
      const { data: viewEvents, error: eventsError } = await eventQuery;
      if (eventsError || !viewEvents) {
        logRepositoryFailure("Registrations.listPage", eventsError);
        return loadFailed();
      }
      const eventIds = viewEvents.map((event) => event.id);
      // No events fall in this time window — a legitimate empty result, not a failure.
      if ((filter.view === "upcoming" || filter.view === "previous") && eventIds.length === 0) return empty();

      let titleQuery = this.client.from("events").select("id").ilike("title", `%${searchTerm}%`);
      if (filter.view === "upcoming") titleQuery = titleQuery.gte("starts_at", filter.now);
      if (filter.view === "previous") titleQuery = titleQuery.lt("starts_at", filter.now);
      const { data: titleMatches, error: titleMatchesError } = searchTerm ? await titleQuery : { data: [], error: null };
      if (titleMatchesError) {
        logRepositoryFailure("Registrations.listPage", titleMatchesError);
        return loadFailed();
      }

      let query = this.client.from("registrations").select("*", { count: "exact" });
      if (filter.view === "waitlist") query = query.in("status", ["waitlisted", "invited"]);
      if (filter.view === "previous") query = query.or(`status.eq.cancelled,event_id.in.(${eventIds.join(",")})`);
      if (filter.view === "upcoming") query = query.eq("status", "registered").in("event_id", eventIds);
      if (searchTerm) {
        const textFilters = ["attendee_name", "phone_e164", "email", "public_reference"].map((column) => `${column}.ilike.%${searchTerm}%`);
        if (titleMatches && titleMatches.length > 0) textFilters.push(`event_id.in.(${titleMatches.map((event) => event.id).join(",")})`);
        query = query.or(textFilters.join(","));
      }
      const { data: registrations, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
      if (error || !registrations) {
        logRepositoryFailure("Registrations.listPage", error);
        return loadFailed();
      }

      const pageEventIds = [...new Set(registrations.map((registration) => registration.event_id))];
      const [{ data: eventDetails }, { data: reminders }] = await Promise.all([
        pageEventIds.length ? this.client.from("events").select("id,title,starts_at").in("id", pageEventIds) : Promise.resolve({ data: [] }),
        registrations.length ? this.client.from("registration_reminders").select("*").in("registration_id", registrations.map((registration) => registration.id)).order("prepared_at", { ascending: false }) : Promise.resolve({ data: [] }),
      ]);
      const eventDetailsById = new Map((eventDetails ?? []).map((event) => [event.id, { title: event.title, startsAt: event.starts_at }]));
      const latestReminders = new Map<string, ReminderRow>();
      for (const reminder of reminders ?? []) if (!latestReminders.has(reminder.registration_id)) latestReminders.set(reminder.registration_id, reminder);
      return ok({ items: registrations.map((row) => mapRegistration(row, eventDetailsById.get(row.event_id), latestReminders.get(row.id))), total: count ?? 0, page, pageSize });
    } catch (err) {
      logRepositoryFailure("Registrations.listPage", err);
      return loadFailed();
    }
  }

  async cancel(id: string): Promise<void> {
    const { error } = await this.client.rpc("cancel_registration", { p_registration_id: id });
    if (error) throw mapFailure(error.message);
  }

  async prepareManualMessage(id: string, kind: ManualMessageKind): Promise<ManualMessageReceipt> {
    let token: string | null = null;
    let securePath: string | null = null;

    if (kind === "waitlist_invitation") {
      const invitation = await this.invite(id);
      token = invitation.token;
      securePath = `/waitlist-invitations/${token}`;
    } else if (kind === "feedback_request") {
      const feedback = await this.issueEventFeedbackLink(id);
      token = feedback.token;
      securePath = `/surveys/event-feedback/${token}`;
    } else if (kind !== "cancellation") {
      token = generateSecureToken();
      securePath = `/bookings/${token}`;
    }

    const { data, error } = await this.client.rpc("prepare_manual_registration_message", {
      p_registration_id: id,
      p_message_kind: kind,
      ...(token ? { p_secure_token_hash: hashSecureToken(token) } : {}),
    });
    if (error || !data) throw mapFailure(error?.message ?? "save");
    return { id: data, kind, securePath };
  }

  async markManualMessageSent(id: string): Promise<string> {
    const { data, error } = await this.client.rpc("mark_manual_message_sent", {
      p_message_id: id,
    });
    if (error || !data) throw mapFailure(error?.message ?? "save");
    return data;
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

  async issueEventFeedbackLink(id: string): Promise<EventFeedbackLinkReceipt> {
    const token = generateSecureToken();
    const { data, error } = await this.client.rpc("issue_event_feedback_link", {
      p_registration_id: id,
      p_feedback_token_hash: hashSecureToken(token),
    });
    if (error || !data) throw mapFailure(error?.message ?? "save");
    return { id: data, token };
  }

  async setPaymentStatus(id: string, status: RegistrationPaymentStatus): Promise<void> {
    const { error } = await this.client.rpc("set_registration_payment_status", {
      p_registration_id: id,
      p_payment_status: status,
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
