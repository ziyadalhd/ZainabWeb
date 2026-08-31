"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import type { AdminPulse } from "@/lib/domain/types";
import { usePoll } from "@/features/admin/use-poll";

const POLL_INTERVAL_MS = 15_000;

export interface AdminArrival {
  registrationId: string;
  attendeeName: string | null;
  eventId: string | null;
  eventTitle: string | null;
  /** How many seats appeared since the previous poll — usually one, more if several landed at once. */
  count: number;
}

/**
 * Watches the whole dashboard for new registrations, wherever the admin happens to be.
 *
 * Mounted once in the protected admin layout, so a registration arriving while the admin is on the
 * requests page or the settings page announces itself just the same. Arrivals are detected by the
 * newest registration's id changing rather than by the count rising — a registration that lands in
 * the same tick as a cancellation leaves the count flat, and that is still an arrival worth
 * announcing.
 *
 * A `router.refresh()` follows every arrival, which re-runs whichever `force-dynamic` admin page is
 * mounted — so the hub's counters, revenue, seat meters, and day-pulse cards all re-read from one
 * refreshed server render instead of going stale until someone reloads.
 *
 * The first response after mount only establishes the baseline; it never announces.
 */
export function useAdminPulse(onArrival: (arrival: AdminArrival) => void): void {
  const router = useRouter();
  const knownLatestId = useRef<string | null | undefined>(undefined);
  const knownCount = useRef(0);

  usePoll<AdminPulse>("/admin/pulse", POLL_INTERVAL_MS, (pulse) => {
    if (typeof pulse.activeCount !== "number") return;

    const first = knownLatestId.current === undefined;
    const arrived = pulse.latestRegistrationId !== null && pulse.latestRegistrationId !== knownLatestId.current;
    const added = Math.max(1, pulse.activeCount - knownCount.current);

    knownLatestId.current = pulse.latestRegistrationId;
    knownCount.current = pulse.activeCount;
    if (first || !arrived) return;

    onArrival({
      registrationId: pulse.latestRegistrationId!,
      attendeeName: pulse.attendeeName,
      eventId: pulse.eventId,
      eventTitle: pulse.eventTitle,
      count: added,
    });
    router.refresh();
  });
}
