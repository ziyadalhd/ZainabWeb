import { describe, expect, it } from "vitest";
import { mapEventRow } from "@/lib/supabase/events";

const row = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  title: "لقاء",
  audience: "adults",
  event_type_label: "قراءة",
  starts_at: "2026-08-10T15:00:00.000Z",
  ends_at: "2026-08-10T17:00:00.000Z",
  capacity: 20,
  price_halalas: 7500,
  registration_status: "open",
  publication_status: "draft",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

const state = {
  event_id: row.id,
  active_reservation_count: 4,
  registration_availability: "available",
};

describe("mapEventRow", () => {
  it("keeps Supabase types inside the adapter", () => {
    expect(mapEventRow(row, state)).toEqual({
      id: row.id,
      title: "لقاء",
      audience: "adults",
      eventTypeLabel: "قراءة",
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      capacity: 20,
      activeReservationCount: 4,
      priceHalalas: 7500,
      registrationStatus: "open",
      availability: "available",
      publicationStatus: "draft",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  });

  it("rejects unexpected constrained values", () => {
    expect(() => mapEventRow({ ...row, publication_status: "deleted" }, state)).toThrow();
  });
});
