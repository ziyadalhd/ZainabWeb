"use client";

import { useRegistrationPulse } from "@/features/admin/use-registration-pulse";
import { formatArabicNumber } from "@/lib/format/date";

/**
 * The roster's live header: seats held on this event, and arrivals since the screen was opened.
 *
 * Sound and the toast belong to the dashboard-wide listener in the admin layout, which fires once
 * per arrival wherever the admin is. This band is the event-scoped record of the same event: it
 * keeps the number in front of the admin who is actually working this roster, and the badge stays
 * put after the toast has faded.
 */
export function RegistrationPulseBanner({ eventId, initialCount, capacity }: { eventId: string; initialCount: number; capacity: number }) {
  const { activeCount, arrivals, latestName } = useRegistrationPulse(eventId, initialCount);

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
    </div>
  );
}
