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
    const { data, error } = await this.client.rpc("submit_service_request", {
      p_request_kind: kind,
      p_requester_name: input.requesterName,
      p_phone_e164: input.phoneE164,
      p_email: input.email ?? "",
      p_use_or_occasion_type: booking?.useOrOccasionType ?? "",
      p_requested_date: booking?.requestedDate ?? null,
      p_requested_start_time: booking?.requestedStartTime ?? null,
      p_requested_end_time: booking?.requestedEndTime ?? null,
      p_attendee_count: booking?.attendeeCount ?? null,
      p_workshop_title: workshop?.title ?? "",
      p_workshop_description: workshop?.description ?? "",
      p_workshop_target_audience: workshop?.targetAudience ?? "",
      p_workshop_duration: workshop?.duration ?? "",
      p_workshop_expected_attendance: workshop?.expectedAttendance ?? null,
      p_workshop_requirements: workshop?.requirements ?? "",
      p_workshop_portfolio_url: workshop?.portfolioUrl ?? "",
      p_notes: input.notes ?? "",
      p_management_token_hash: hashSecureToken(managementToken),
    } as unknown as Database["public"]["Functions"]["submit_service_request"]["Args"]);
    if (error || !data) throw mapFailure(error?.message ?? "save");
    return { reference: data, managementToken };
  }

  async list(): Promise<readonly AdminServiceRequest[]> {
    const { data, error } = await this.client
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) throw new ServiceRequestFailure("save");
    return data.map(mapServiceRequestRow);
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
    const { data, error } = await this.client.rpc("get_service_request_conflicts", { p_request_id: id });
    if (error || !data) throw new ServiceRequestFailure("save");
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
  }
}

export async function createServiceRequestService(): Promise<ServiceRequestService> {
  return new SupabaseServiceRequestRepository(await createSupabaseServerClient());
}

export async function createAdminServiceRequestRepository(): Promise<AdminServiceRequestRepository> {
  return new SupabaseServiceRequestRepository(await createSupabaseServerClient());
}
