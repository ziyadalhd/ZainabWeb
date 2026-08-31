"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { playRegistrationChime, useRegistrationPulse } from "@/features/admin/use-registration-pulse";
import { formatArabicNumber } from "@/lib/format/date";

/**
 * The roster's live header: seats held, arrivals since the screen opened, and a mute control.
 *
 * Mounted above the registration list so a registration landing mid-session announces itself three
 * ways at once — a badge that persists, a toast that names the guest, and a short chime — instead
 * of waiting for the admin to think to reload.
 */
export function RegistrationPulseBanner({ eventId, initialCount, capacity }: { eventId: string; initialCount: number; capacity: number }) {
  const { pushToast } = useToast();
  const [muted, setMuted] = useState(false);

  const { activeCount, arrivals, latestName } = useRegistrationPulse(eventId, initialCount, (name, count) => {
    pushToast(count === 1 && name ? `تسجيل جديد: ${name}` : `وصل ${formatArabicNumber(count)} تسجيلات جديدة.`, "success");
    if (!muted) playRegistrationChime();
  });

  return (
    <div className="registration-pulse" aria-live="polite">
      <span className="registration-pulse__dot" aria-hidden="true" />
      <p className="registration-pulse__count numeral">
        {formatArabicNumber(activeCount)} / {formatArabicNumber(capacity)} مقعدًا
      </p>
      {arrivals > 0 ? (
        <span className="registration-pulse__badge">
          {formatArabicNumber(arrivals)} تسجيل جديد{latestName ? ` — آخرها ${latestName}` : ""}
        </span>
      ) : (
        <span className="registration-pulse__idle">التحديث تلقائي</span>
      )}
      <button
        type="button"
        className="registration-pulse__mute"
        aria-pressed={muted}
        onClick={() => setMuted((current) => !current)}
      >
        {muted ? "تشغيل التنبيه الصوتي" : "كتم التنبيه الصوتي"}
      </button>
    </div>
  );
}
