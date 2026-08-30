import { describe, expect, it } from "vitest";
import { summariseEventRevenue } from "@/features/admin/event-revenue";
import type { Event, Registration } from "@/lib/domain/types";

const event = { priceHalalas: 15000 } as Event;

function registration(paymentStatus: Registration["paymentStatus"]): Registration {
  return { paymentStatus } as Registration;
}

describe("summariseEventRevenue", () => {
  it("multiplies the price by the number of held seats", () => {
    const summary = summariseEventRevenue(event, [registration("paid_in_full"), registration("unpaid")]);
    expect(summary.expectedHalalas).toBe(30000);
  });

  it("counts settlement rather than reporting a collected amount", () => {
    const summary = summariseEventRevenue(event, [registration("paid_in_full"), registration("deposit_paid"), registration("unpaid")]);
    expect(summary.paidInFullCount).toBe(1);
    expect(summary.outstandingCount).toBe(2);
  });

  it("reports no expected revenue for an event with no price set", () => {
    expect(summariseEventRevenue({ priceHalalas: null } as Event, [registration("unpaid")]).expectedHalalas).toBeNull();
  });
});
