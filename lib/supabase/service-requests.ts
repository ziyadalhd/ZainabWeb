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
  AdminServiceRequestListFilter,
  PaginatedResult,
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
    contactedAt: row.contacted_at,
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

    const requesterName = input.requesterName.trim();
    const phoneE164 = input.phoneE164;

    const useOrOccasionType = kind === "workshop_application"
      ? ""
      : booking?.useOrOccasionType.trim() ?? "";

    const requestedDate = kind === "workshop_application"
      ? null
      : booking?.requestedDate ?? null;

    const requestedStartTime = kind === "workshop_application"
      ? null
      : booking?.requestedStartTime ?? null;

    const requestedEndTime = kind === "workshop_application"
      ? null
      : booking?.requestedEndTime ?? null;

    const attendeeCount = kind === "workshop_application"
      ? null
      : booking?.attendeeCount ?? null;

    const workshopTitle = kind === "workshop_application"
      ? workshop?.title.trim() ?? ""
      : "";

    const workshopDescription = kind === "workshop_application"
      ? workshop?.description.trim() ?? ""
      : "";

    const workshopTargetAudience = kind === "workshop_application"
      ? workshop?.targetAudience.trim() ?? ""
      : "";

    const workshopDuration = kind === "workshop_application"
      ? workshop?.duration.trim() ?? ""
      : "";

    const workshopExpectedAttendance = kind === "workshop_application"
      ? workshop?.expectedAttendance ?? null
      : null;

    const workshopRequirements = kind === "workshop_application"
      ? workshop?.requirements.trim() ?? ""
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
    } catch {
      throw new ServiceRequestFailure("save");
    }

    throw new ServiceRequestFailure("save");
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

  async listPage(filter: AdminServiceRequestListFilter): Promise<PaginatedResult<AdminServiceRequest>> {
    const page = Math.max(1, Math.floor(filter.page));
    const pageSize = Math.min(100, Math.max(1, Math.floor(filter.pageSize)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const searchTerm = filter.query.trim().replace(/[,%().]/g, "");
    try {
      let query = this.client.from("service_requests").select("*", { count: "exact" });
      if (filter.status !== "all") query = query.eq("status", filter.status);
      if (filter.kind !== "all") query = query.eq("request_kind", filter.kind);
      if (searchTerm) query = query.or([
        "requester_name", "phone_e164", "email", "public_reference", "workshop_title", "use_or_occasion_type",
      ].map((column) => `${column}.ilike.%${searchTerm}%`).join(","));
      const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
      if (error || !data) return { items: [], total: 0, page, pageSize };
      return { items: data.map(mapServiceRequestRow), total: count ?? 0, page, pageSize };
    } catch (err) {
      console.warn("[ServiceRequest] listPage failed gracefully:", err);
      return { items: [], total: 0, page, pageSize };
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

  async markContacted(id: string): Promise<void> {
    const { error } = await this.client.rpc("mark_service_request_contacted", { p_request_id: id });
    if (error) throw mapFailure(error.message);
  }
}

export async function createServiceRequestService(): Promise<ServiceRequestService> {
  return new SupabaseServiceRequestRepository(await createSupabaseServerClient());
}

export async function createAdminServiceRequestRepository(): Promise<AdminServiceRequestRepository> {
  return new SupabaseServiceRequestRepository(await createSupabaseServerClient());
}
