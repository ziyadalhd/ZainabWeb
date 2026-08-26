import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapServiceRequestRow, SupabaseServiceRequestRepository } from "@/lib/supabase/service-requests";
import type { Database } from "@/lib/supabase/database.types";

type ServiceRequestRow = Database["public"]["Tables"]["service_requests"]["Row"];

function chainable(result: { data: unknown; error: unknown; count?: number }): PromiseLike<{ data: unknown; error: unknown; count?: number }> {
  const handler: Record<string, unknown> = {
    then: (onFulfilled: (value: { data: unknown; error: unknown; count?: number }) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  for (const method of ["select", "order", "eq", "in", "ilike", "or", "range"]) {
    handler[method] = () => handler;
  }
  return handler as unknown as PromiseLike<{ data: unknown; error: unknown; count?: number }>;
}

function fakeClient(result: { data: unknown; error: unknown }): SupabaseClient<Database> {
  return { from: () => chainable(result) } as unknown as SupabaseClient<Database>;
}

describe("mapServiceRequestRow", () => {
  it("keeps every approved workshop detail for the admin dashboard", () => {
    const row: ServiceRequestRow = {
      attendee_count: null,
      contacted_at: null,
      created_at: "2026-08-16T09:00:00.000Z",
      email: "presenter@example.com",
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      management_token_hash: "a".repeat(64),
      notes: "أفضل الفترة المسائية",
      offer_expires_at: null,
      offer_price_halalas: null,
      offer_responded_at: null,
      offer_terms: null,
      payment_status: "unpaid",
      phone_e164: "+966500000001",
      public_reference: "BAYN-REQUEST-1",
      request_kind: "workshop_application",
      requested_date: null,
      requested_end_time: null,
      requested_start_time: null,
      requester_name: "نورة عبدالله",
      retention_until: null,
      status: "new",
      updated_at: "2026-08-16T09:00:00.000Z",
      use_or_occasion_type: null,
      workshop_description: "ورشة عن كتابة الحكاية المحلية",
      workshop_duration: "ساعتان",
      workshop_expected_attendance: 18,
      workshop_portfolio_url: "https://example.com/portfolio",
      workshop_requirements: "طاولات وأقلام",
      workshop_target_audience: "الكبار",
      workshop_title: "حكايات مكة",
    };

    expect(mapServiceRequestRow(row)).toMatchObject({
      workshopTitle: "حكايات مكة",
      workshopDescription: "ورشة عن كتابة الحكاية المحلية",
      workshopTargetAudience: "الكبار",
      workshopDuration: "ساعتان",
      workshopExpectedAttendance: 18,
      workshopRequirements: "طاولات وأقلام",
      workshopPortfolioUrl: "https://example.com/portfolio",
    });
  });
});

describe("SupabaseServiceRequestRepository.list", () => {
  it("returns a load-failed result instead of an empty array when the query errors (admin overhaul plan A2)", async () => {
    const repository = new SupabaseServiceRequestRepository(fakeClient({ data: null, error: { code: "PGRST116" } }));

    await expect(repository.list()).resolves.toEqual({ ok: false, code: "load_failed" });
  });
});
