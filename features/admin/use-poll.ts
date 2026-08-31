"use client";

import { useEffect, useRef } from "react";

/**
 * Polls a JSON endpoint on an interval and hands each payload to `onPayload`.
 *
 * Pauses entirely while the tab is hidden and catches up the moment it comes back, so a dashboard
 * left open in a background tab costs nothing until someone looks at it. A failed or non-OK
 * response is swallowed: a dropped poll is not worth surfacing when the next tick retries.
 *
 * `onPayload` is held in a ref refreshed by its own effect, so a caller can pass an inline callback
 * closing over fresh state without restarting the interval on every render.
 */
export function usePoll<T>(url: string, intervalMs: number, onPayload: (payload: T) => void): void {
  const handle = useRef(onPayload);
  useEffect(() => {
    handle.current = onPayload;
  }, [onPayload]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (document.hidden) return;
      let payload: T;
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) return;
        payload = (await response.json()) as T;
      } catch {
        return;
      }
      if (!cancelled) handle.current(payload);
    }

    const timer = window.setInterval(poll, intervalMs);
    document.addEventListener("visibilitychange", poll);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [url, intervalMs]);
}
