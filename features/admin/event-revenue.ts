import type { Event, Registration } from "@/lib/domain/types";

export interface EventRevenueSummary {
  /** price × seats currently held. Null when the event has no price set. */
  expectedHalalas: number | null;
  /** Registrations settled in full — a count, not an amount: no deposit size is defined anywhere. */
  paidInFullCount: number;
  outstandingCount: number;
}

/**
 * Summarises what an event is worth and how much of it is settled.
 *
 * Deliberately reports settlement as counts rather than money: `deposit_paid` carries no amount in
 * the domain model, so any collected-revenue figure would be an invented business rule.
 */
export function summariseEventRevenue(event: Event, registered: readonly Registration[]): EventRevenueSummary {
  const paidInFullCount = registered.filter((registration) => registration.paymentStatus === "paid_in_full").length;
  return {
    expectedHalalas: event.priceHalalas === null ? null : event.priceHalalas * registered.length,
    paidInFullCount,
    outstandingCount: registered.length - paidInFullCount,
  };
}
