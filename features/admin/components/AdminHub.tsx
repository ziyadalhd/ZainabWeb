import Link from "next/link";
import type { CalendarItem } from "@/features/admin/calendar-items";
import { CalendarMonthGrid } from "@/features/admin/components/CalendarMonthGrid";
import { buildAttentionGroups, buildRecentItems } from "@/features/admin/attention-items";
import type { AdminServiceRequest, Event, Registration } from "@/lib/domain/types";
import { formatArabicDateTime, formatArabicNumber } from "@/lib/format/date";

interface AdminHubProps {
  events: readonly Event[];
  registrations: readonly Registration[];
  requests: readonly AdminServiceRequest[];
  now: number;
  calendarItems: readonly CalendarItem[];
  month: Date;
  monthHrefPrevious: string;
  monthHrefNext: string;
  monthHrefCurrent: string;
}

export function AdminHub({
  events,
  registrations,
  requests,
  now,
  calendarItems,
  month,
  monthHrefPrevious,
  monthHrefNext,
  monthHrefCurrent,
}: AdminHubProps) {
  const attention = buildAttentionGroups(events, registrations, requests, now);
  const recent = buildRecentItems(registrations, requests, now, 3);

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(19rem,0.85fr)]">
      <section aria-labelledby="admin-hub-calendar-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="admin-hub-calendar-heading" className="sr-only">
            التقويم
          </h2>
          <nav aria-label="التنقل بين أشهر التقويم" className="flex flex-wrap gap-2">
            <Link className="button-quiet" href={monthHrefPrevious}>
              الشهر السابق
            </Link>
            <Link className="button-quiet" href={monthHrefNext}>
              الشهر التالي
            </Link>
            <Link className="button-secondary" href={monthHrefCurrent}>
              الشهر الحالي
            </Link>
          </nav>
          <Link href="/admin/events/new" className="button-primary">
            فعالية جديدة
          </Link>
        </div>
        <CalendarMonthGrid items={calendarItems} month={month} />
      </section>

      <aside aria-labelledby="attention-heading" className="grid content-start gap-6">
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">قائمة التشغيل</p>
              <h2 id="attention-heading" className="mt-2 text-2xl font-black text-[var(--brand-forest)]">
                يحتاج معالجة
              </h2>
            </div>
            <span className="data-value text-sm font-bold muted-copy">{formatArabicNumber(attention.length)} مهام</span>
          </div>
          {attention.length ? (
            <div className="grid gap-3">
              {attention.map((group) =>
                group.members.length === 1 ? (
                  <Link key={group.id} href={group.members[0]!.href} className={`attention-item attention-item--${group.tone}`}>
                    <span className="attention-item__dot" aria-hidden="true" />
                    <span>
                      <strong>{group.title}</strong>
                      <small>{group.members[0]!.description}</small>
                    </span>
                    <span aria-hidden="true">←</span>
                  </Link>
                ) : (
                  <details key={group.id} className={`attention-item attention-item--group attention-item--${group.tone}`}>
                    <summary>
                      <span className="attention-item__dot" aria-hidden="true" />
                      <strong>{group.title}</strong>
                    </summary>
                    <div className="attention-item__members">
                      {group.members.map((member) => (
                        <Link key={member.id} href={member.href} className="attention-item__member">
                          {member.description}
                        </Link>
                      ))}
                    </div>
                  </details>
                ),
              )}
            </div>
          ) : (
            <div className="card-surface px-5 py-6">
              <p className="font-bold">لا توجد مهام تحتاج معالجة الآن.</p>
              <p className="mt-1 text-sm muted-copy">راجعي التقويم أو أنشئي فعالية جديدة عند الحاجة.</p>
            </div>
          )}
        </section>

        <section aria-labelledby="recent-heading">
          <h3 id="recent-heading" className="eyebrow mb-3">
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
