"use client";

import { useRef, useState } from "react";
import type { RegistrationPulse } from "@/lib/domain/types";
import { usePoll } from "@/features/admin/use-poll";

const POLL_INTERVAL_MS = 15_000;

export interface RegistrationPulseState {
  /** Held seats as of the last successful poll — the server count, not a local guess. */
  activeCount: number;
  /** Registrations that landed on this event since the screen was opened. */
  arrivals: number;
  /** Name on the newest registration, for the badge. */
  latestName: string | null;
}

/**
 * Keeps one event's seat count in step with registrations arriving while the admin watches it.
 *
 * Scoped to the inspector's roster: this is the live count and arrival tally for a single event.
 * Announcing an arrival — chime, toast, page refresh — is not its job and never was duplicated
 * here; `useAdminPulse` in the protected layout owns that for the whole dashboard, so an arrival
 * makes exactly one sound no matter how many screens are watching.
 *
 * The first response after mount only establishes the baseline.
 */
export function useRegistrationPulse(eventId: string, initialCount: number): RegistrationPulseState {
  const [state, setState] = useState<RegistrationPulseState>({ activeCount: initialCount, arrivals: 0, latestName: null });
  const knownCount = useRef(initialCount);

  usePoll<RegistrationPulse>(`/admin/events/${eventId}/pulse`, POLL_INTERVAL_MS, (pulse) => {
    if (typeof pulse.activeCount !== "number") return;

    const arrived = pulse.activeCount - knownCount.current;
    knownCount.current = pulse.activeCount;
    if (arrived <= 0) {
      setState((current) => ({ ...current, activeCount: pulse.activeCount }));
      return;
    }
    setState((current) => ({ activeCount: pulse.activeCount, arrivals: current.arrivals + arrived, latestName: pulse.latestName }));
  });

  return state;
}
