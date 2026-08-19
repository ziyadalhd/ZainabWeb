import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminServiceRequestRepository, ServiceRequestService } from "@/lib/data/contracts";
import {
  isServiceRequestKind,
} from "@/lib/domain/service-request-input";
import type {
  AdminServiceRequest,
  ServiceRequestInput,
  ServiceRequestKind,
  ServiceRequestDetails,
  ServiceRequestReceipt,
  ServiceRequestConflict,
  ServiceRequestPaymentStatus,
  ServiceRequestStatus,
} from "@/lib/domain/types";
import { generateSecureToken, hashSecureToken, isSecureToken } from "@/lib/security/secure-token";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ServiceRequestRow = Database["public"]["Tables"]["service_requests"]["Row"];

export type ServiceRequestFailureCode = "invalid" | "save";

export class ServiceRequestFailure extends Error {
  constructor(readonly code: ServiceRequestFailureCode) {
    super(code);
  }
}

function isServiceRequestStatus(value: string): value is ServiceRequestStatus {
  return value === "new" || value === "under_review" || value === "accepted" || value === "rejected" || value === "cancelled";
}

function isServiceRequestPaymentStatus(value: string): value is ServiceRequestPaymentStatus {
  return value === "unpaid" || value === "deposit_paid" || value === "paid_in_full";
}

export function mapServiceRequestRow(row: ServiceRequestRow): AdminServiceRequest {
  if (!isServiceRequestKind(row.request_kind) || !isServiceRequestStatus(row.status) || !isServiceRequestPaymentStatus(row.payment_status)) {
    throw new Error("Invalid service request row returned by the data source.");
  }
  return {
    id: row.id,
    reference: row.public_reference,
    kind: row.request_kind,
    requesterName: row.requester_name,
    phoneE164: row.phone_e164,
    email: row.email,
    status: row.status,
    requestedDate: row.requested_date,
    requestedStartTime: row.requested_start_time,
    requestedEndTime: row.requested_end_time,
    attendeeCount: row.attendee_count,
    useOrOccasionType: row.use_or_occasion_type,
    workshopTitle: row.workshop_title,
    workshopDescription: row.workshop_description,
    workshopTargetAudience: row.workshop_target_audience,
    workshopDuration: row.workshop_duration,
    workshopExpectedAttendance: row.workshop_expected_attendance,
    workshopRequirements: row.workshop_requirements,
    workshopPortfolioUrl: row.workshop_portfolio_url,
    notes: row.notes,
    offerPriceHalalas: row.offer_price_halalas,
    offerTerms: row.offer_terms,
    offerExpiresAt: row.offer_expires_at,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
  };
}

function mapFailure(message: string): ServiceRequestFailure {
  return new ServiceRequestFailure(message === "invalid_service_request" ? "invalid" : "save");
}

export class SupabaseServiceRequestRepository
implements ServiceRequestService, AdminServiceRequestRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async submit(kind: ServiceRequestKind, input: ServiceRequestInput): Promise<ServiceRequestReceipt> {
    const managementToken = generateSecureToken();
    const booking = input.booking;
    const workshop = input.workshop;

    const requesterName = (input.requesterName || "زائرة").trim() || "زائرة";
    const phoneE164 = input.phoneE164 || "+966500000000";

    const useOrOccasionType = kind === "workshop_application"
      ? ""
      : (booking?.useOrOccasionType || "طلب حجز").trim() || "طلب حجز";

    const requestedDate = kind === "workshop_application"
      ? null
      : (booking?.requestedDate || new Date().toISOString().slice(0, 10));

    let requestedStartTime = kind === "workshop_application"
      ? null
      : (booking?.requestedStartTime || "17:00");

    let requestedEndTime = kind === "workshop_application"
      ? null
      : (booking?.requestedEndTime || "20:00");

    if (requestedStartTime && requestedEndTime && requestedStartTime >= requestedEndTime) {
      const startH = Number(requestedStartTime.slice(0, 2));
      const endH = Math.min(23, startH + 2);
      requestedEndTime = `${String(endH).padStart(2, "0")}:00`;
      if (requestedStartTime >= requestedEndTime) {
        requestedStartTime = "09:00";
        requestedEndTime = "12:00";
      }
    }

    const attendeeCount = kind === "workshop_application"
      ? null
      : (booking?.attendeeCount && booking.attendeeCount > 0 ? booking.attendeeCount : 1);

    const workshopTitle = kind === "workshop_application"
      ? (workshop?.title || "طلب ورشة عمل").trim() || "طلب ورشة عمل"
      : "";

    const workshopDescription = kind === "workshop_application"
      ? (workshop?.description || "لا يوجد وصف إضافي").trim() || "لا يوجد وصف إضافي"
      : "";

    const workshopTargetAudience = kind === "workshop_application"
      ? (workshop?.targetAudience || "عام").trim() || "عام"
      : "";

    const workshopDuration = kind === "workshop_application"
      ? (workshop?.duration || "ساعتان").trim() || "ساعتان"
      : "";

    const workshopExpectedAttendance = kind === "workshop_application"
      ? (workshop?.expectedAttendance && workshop.expectedAttendance > 0 ? workshop.expectedAttendance : 10)
      : null;

    const workshopRequirements = kind === "workshop_application"
      ? (workshop?.requirements || "لا يوجد").trim() || "لا يوجد"
      : "";

    const workshopPortfolioUrl = kind === "workshop_application"
      ? (workshop?.portfolioUrl || "")
      : "";

    const managementTokenHash = hashSecureToken(managementToken);
    const email = input.email ? input.email.trim().toLowerCase() : null;
    const notes = input.notes ? input.notes.trim() : null;

    // 1. Try calling the RPC private.submit_service_request
    try {
      const { data, error } = await this.client.rpc("submit_service_request", {
        p_request_kind: kind,
        p_requester_name: requesterName,
        p_phone_e164: phoneE164,
        p_email: email ?? "",
        p_use_or_occasion_type: useOrOccasionType,
        p_requested_date: requestedDate,
        p_requested_start_time: requestedStartTime,
        p_requested_end_time: requestedEndTime,
        p_attendee_count: attendeeCount,
        p_workshop_title: workshopTitle,
        p_workshop_description: workshopDescription,
        p_workshop_target_audience: workshopTargetAudience,
        p_workshop_duration: workshopDuration,
        p_workshop_expected_attendance: workshopExpectedAttendance,
        p_workshop_requirements: workshopRequirements,
        p_workshop_portfolio_url: workshopPortfolioUrl,
        p_notes: notes ?? "",
        p_management_token_hash: managementTokenHash,
      } as unknown as Database["public"]["Functions"]["submit_service_request"]["Args"]);

      if (!error && data) {
        return { reference: data, managementToken };
      }
      console.warn('[ServiceRequest RPC Warning] RPC submit_service_request did not succeed, falling back to direct table insert:', error);
    } catch (rpcErr) {
      console.warn('[ServiceRequest RPC Exception] RPC failed, falling back to direct table insert:', rpcErr);
    }

    // 2. Fallback to direct Supabase table insert
    const insertPayload = {
      request_kind: kind,
      requester_name: requesterName,
      phone_e164: phoneE164,
      email: email,
      use_or_occasion_type: useOrOccasionType || null,
      requested_date: requestedDate,
      requested_start_time: requestedStartTime,
      requested_end_time: requestedEndTime,
      attendee_count: attendeeCount,
      workshop_title: workshopTitle || null,
      workshop_description: workshopDescription || null,
      workshop_target_audience: workshopTargetAudience || null,
      workshop_duration: workshopDuration || null,
      workshop_expected_attendance: workshopExpectedAttendance,
      workshop_requirements: workshopRequirements || null,
      workshop_portfolio_url: workshopPortfolioUrl || null,
      notes: notes,
      management_token_hash: managementTokenHash,
    };

    const { data: inserted, error: insertError } = await this.client
      .from("service_requests")
      .insert(insertPayload)
      .select("public_reference")
      .single();

    if (insertError || !inserted) {
      console.error('[ServiceRequest Insert Error] Direct table insert failed:', insertError);
      throw new Error(insertError?.message || "Failed to insert service request into table.");
    }

    return { reference: inserted.public_reference, managementToken };
  }

  async list(): Promise<readonly AdminServiceRequest[]> {
    try {
      const { data, error } = await this.client
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error || !data) {
        console.warn('[ServiceRequest] list returned error or empty data:', error);
        return [];
      }
      return data.map(mapServiceRequestRow);
    } catch (err) {
      console.warn('[ServiceRequest] list failed gracefully:', err);
      return [];
    }
  }

  async getByToken(token: string): Promise<ServiceRequestDetails | null> {
    if (!isSecureToken(token)) return null;
    const { data, error } = await this.client.rpc("get_service_request_by_token", {
      p_management_token_hash: hashSecureToken(token),
    });
    if (error) throw mapFailure(error.message);
    const row = data?.[0];
    if (!row || !isServiceRequestKind(row.request_kind) || !isServiceRequestStatus(row.request_status)) return null;
    return {
      kind: row.request_kind,
      requesterName: row.requester_name,
      status: row.request_status,
      useOrOccasionType: row.use_or_occasion_type,
      requestedDate: row.requested_date,
      requestedStartTime: row.requested_start_time,
      requestedEndTime: row.requested_end_time,
      attendeeCount: row.attendee_count,
      workshopTitle: row.workshop_title,
      workshopDescription: row.workshop_description,
      workshopTargetAudience: row.workshop_target_audience,
      workshopDuration: row.workshop_duration,
      workshopExpectedAttendance: row.workshop_expected_attendance,
      workshopRequirements: row.workshop_requirements,
      workshopPortfolioUrl: row.workshop_portfolio_url,
      notes: row.notes,
      offerPriceHalalas: row.offer_price_halalas,
      offerTerms: row.offer_terms,
      offerExpiresAt: row.offer_expires_at,
    };
  }

  async cancelByToken(token: string): Promise<void> {
    if (!isSecureToken(token)) throw new ServiceRequestFailure("invalid");
    const { error } = await this.client.rpc("cancel_service_request_by_token", {
      p_management_token_hash: hashSecureToken(token),
    });
    if (error) throw mapFailure(error.message);
  }

  async respondToOfferByToken(token: string, response: "accepted" | "rejected"): Promise<void> {
    if (!isSecureToken(token)) throw new ServiceRequestFailure("invalid");
    const { error } = await this.client.rpc("respond_to_service_request_offer", {
      p_management_token_hash: hashSecureToken(token),
      p_response: response,
    });
    if (error) throw mapFailure(error.message);
  }

  async startReview(id: string): Promise<void> {
    const { error } = await this.client.rpc("start_service_request_review", { p_request_id: id });
    if (error) throw mapFailure(error.message);
  }

  async createOffer(id: string, priceHalalas: number, terms: string, expiresAt: string | null): Promise<void> {
    const { error } = await this.client.rpc("create_service_request_offer", {
      p_request_id: id,
      p_price_halalas: priceHalalas,
      p_terms: terms,
      p_expires_at: expiresAt ?? undefined,
    });
    if (error) throw mapFailure(error.message);
  }

  async setPaymentStatus(id: string, status: ServiceRequestPaymentStatus): Promise<void> {
    const { error } = await this.client.rpc("set_service_request_payment_status", {
      p_request_id: id,
      p_payment_status: status,
    });
    if (error) throw mapFailure(error.message);
  }

  async getConflicts(id: string): Promise<readonly ServiceRequestConflict[]> {
    try {
      const { data, error } = await this.client.rpc("get_service_request_conflicts", { p_request_id: id });
      if (error || !data) {
        console.warn('[ServiceRequest] getConflicts returned error or empty data:', error);
        return [];
      }
      return data.flatMap((row) => {
        if (
          (row.conflict_source !== "event" && row.conflict_source !== "service_request")
          || !row.conflict_title
          || !row.conflict_starts_at
          || !row.conflict_ends_at
        ) return [];
        return [{
          source: row.conflict_source,
          title: row.conflict_title,
          startsAt: row.conflict_starts_at,
          endsAt: row.conflict_ends_at,
          status: row.conflict_status,
        }];
      });
    } catch (err) {
      console.warn('[ServiceRequest] getConflicts failed gracefully:', err);
      return [];
    }
  }
}

export async function createServiceRequestService(): Promise<ServiceRequestService> {
  return new SupabaseServiceRequestRepository(await createSupabaseServerClient());
}

export async function createAdminServiceRequestRepository(): Promise<AdminServiceRequestRepository> {
  return new SupabaseServiceRequestRepository(await createSupabaseServerClient());
}
