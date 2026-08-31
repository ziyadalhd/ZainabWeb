"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RegistrationPulse } from "@/lib/domain/types";
import { playRegistrationChime } from "@/features/admin/registration-pulse-sound";

const POLL_INTERVAL_MS = 15_000;

export interface RegistrationPulseState {
  /** Held seats as of the last successful poll — the server count, not a local guess. */
  activeCount: number;
  /** Registrations that landed since this screen was opened. */
  arrivals: number;
  /** Name on the newest registration, for the badge and the toast. */
  latestName: string | null;
}

/**
 * Keeps the roster in step with registrations arriving while the admin is looking at it.
 *
 * Polls the event's pulse endpoint on an interval, pauses entirely while the tab is hidden (and
 * catches up immediately on focus), and calls `router.refresh()` only when the count actually moved
 * — so the real rows, the counters, and the capacity meter all re-read from one refreshed server
 * render instead of drifting into separate states.
 *
 * The first response after mount only establishes the baseline; it never announces an arrival.
 */
export function useRegistrationPulse(
  eventId: string,
  initialCount: number,
  onArrival: (name: string | null, count: number) => void,
): RegistrationPulseState {
  const [state, setState] = useState<RegistrationPulseState>({ activeCount: initialCount, arrivals: 0, latestName: null });
  const router = useRouter();
  const knownCount = useRef(initialCount);
  // Held in a ref, refreshed in its own effect, so a caller can pass an inline callback that closes
  // over fresh state without restarting the poll on every render.
  const announce = useRef(onArrival);
  useEffect(() => {
    announce.current = onArrival;
  }, [onArrival]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (document.hidden) return;
      let pulse: RegistrationPulse;
      try {
        const response = await fetch(`/admin/events/${eventId}/pulse`, { cache: "no-store" });
        if (!response.ok) return;
        pulse = (await response.json()) as RegistrationPulse;
      } catch {
        return; // A dropped poll is not worth surfacing; the next tick retries.
      }
      if (cancelled || typeof pulse.activeCount !== "number") return;

      const arrived = pulse.activeCount - knownCount.current;
      knownCount.current = pulse.activeCount;
      if (arrived <= 0) {
        setState((current) => ({ ...current, activeCount: pulse.activeCount }));
        return;
      }

      setState((current) => ({ activeCount: pulse.activeCount, arrivals: current.arrivals + arrived, latestName: pulse.latestName }));
      announce.current(pulse.latestName, arrived);
      router.refresh();
    }

    const timer = window.setInterval(poll, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [eventId, router]);

  return state;
}

export { playRegistrationChime };
