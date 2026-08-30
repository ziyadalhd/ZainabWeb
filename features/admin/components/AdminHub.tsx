import Link from "next/link";
import { DayPulse } from "@/features/admin/components/DayPulse";
import { TriageStream, type TriageRegistrationActions } from "@/features/admin/components/TriageStream";
import { buildRecentItems, buildTriageItems } from "@/features/admin/attention-items";
import type { PulseItem } from "@/features/admin/day-pulse";
import type { AdminServiceRequest, Event, Registration } from "@/lib/domain/types";
import { formatArabicDateTime, formatArabicNumber } from "@/lib/format/date";

interface AdminHubProps {
  events: readonly Event[];
  registrations: readonly Registration[];
  requests: readonly AdminServiceRequest[];
  now: number;
  pulseItems: readonly PulseItem[];
  selectedDay: Date;
  today: Date;
  dayHrefFor: (day: Date) => string;
  calendarHref: string;
  registrationActions: TriageRegistrationActions;
}

export function AdminHub({
  events,
  registrations,
  requests,
  now,
  pulseItems,
  selectedDay,
  today,
  dayHrefFor,
  calendarHref,
  registrationActions,
}: AdminHubProps) {
  const triageItems = buildTriageItems(events, registrations, requests, now);
  const recent = buildRecentItems(registrations, requests, now, 3);

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.9fr)_minmax(19rem,1fr)]">
      <section aria-labelledby="triage-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">قائمة التشغيل</p>
            <h2 id="triage-heading" className="mt-2 text-2xl font-bold text-[var(--brand-forest)]">
              يحتاج معالجة
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="data-value text-sm font-medium muted-copy">{formatArabicNumber(triageItems.length)} مهام</span>
            <Link href="/admin/events/new" className="button-primary">
              فعالية جديدة
            </Link>
          </div>
        </div>
        <TriageStream items={triageItems} registrationActions={registrationActions} />
      </section>

      <aside aria-labelledby="pulse-heading" className="grid content-start gap-8">
        <section>
          <h2 id="pulse-heading" className="eyebrow mb-4">
            نبض اليوم
          </h2>
          <DayPulse items={pulseItems} selectedDay={selectedDay} today={today} hrefFor={dayHrefFor} />
          <div className="mt-6 border-t border-[var(--color-border)] pt-4">
            <Link href={calendarHref} className="button-quiet block text-center">
              عرض التقويم الكامل
            </Link>
          </div>
        </section>

        <section aria-labelledby="recent-heading">
          <h3 id="recent-heading" className="eyebrow mb-4">
            الجديد
          </h3>
          {recent.length ? (
            <div className="card-surface divide-y divide-[var(--color-border)]">
              {recent.map((item) => (
                <Link key={item.id} href={item.href} className="activity-item">
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <time>{formatArabicDateTime(item.timestamp)}</time>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm muted-copy">لا يوجد جديد منذ آخر زيارة.</p>
          )}
        </section>
      </aside>
    </div>
  );
}
