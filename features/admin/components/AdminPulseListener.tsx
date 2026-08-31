"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { playRegistrationChime } from "@/features/admin/registration-pulse-sound";
import { useAdminPulse, type AdminArrival } from "@/features/admin/use-admin-pulse";
import { formatArabicNumber } from "@/lib/format/date";

const MUTE_STORAGE_KEY = "bayn:admin-pulse-muted";

/**
 * The chime preference lives in `localStorage` and is read at announce time, never during render.
 *
 * Deliberately not React state: nothing renders from it except a toast label computed at the moment
 * the toast is built, so holding it in state would buy a re-render and a server/client mismatch on
 * first paint for nothing. Both accessors are guarded — a private window or blocked site data
 * throws on access, and unmuted is the right default when it does.
 */
function isMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setMuted(next: boolean): void {
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, next ? "1" : "0");
  } catch {
    // The preference does not survive this session. Not worth telling the admin about.
  }
}

function arrivalMessage({ attendeeName, eventTitle, count }: AdminArrival): string {
  if (count > 1) return `وصل ${formatArabicNumber(count)} تسجيلات جديدة.`;
  const who = attendeeName ?? "مسجّلة جديدة";
  return eventTitle ? `تسجيل جديد: ${who} في فعالية ${eventTitle}` : `تسجيل جديد: ${who}`;
}

/**
 * The dashboard-wide arrival notifier. Renders nothing; it exists to listen.
 *
 * Mounted once in the protected admin layout so a registration announces itself on whichever admin
 * screen is open, and so it announces exactly once — the event inspector's own pulse band is a
 * silent counter for the roster in front of the admin, not a second notifier.
 *
 * The mute control rides in the toast rather than in the dashboard chrome: it is offered at the one
 * moment it is relevant, to an admin who has just heard the chime, and costs no permanent furniture
 * anywhere.
 */
export function AdminPulseListener() {
  const { pushToast } = useToast();

  const announce = useCallback(
    (arrival: AdminArrival) => {
      const muted = isMuted();
      if (!muted) playRegistrationChime();
      pushToast(arrivalMessage(arrival), "success", [
        ...(arrival.eventId ? [{ label: "فتح الفعالية", href: `/admin/events?event=${arrival.eventId}` }] : []),
        { label: muted ? "تشغيل التنبيه" : "كتم التنبيه", onClick: () => setMuted(!muted) },
      ]);
    },
    [pushToast],
  );

  useAdminPulse(announce);

  return null;
}
