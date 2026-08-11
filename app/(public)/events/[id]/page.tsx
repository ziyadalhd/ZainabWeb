import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EventRegistrationForm } from "@/features/events/components/EventRegistrationForm";
import type { EventAudience } from "@/lib/domain/types";
import {
  formatArabicEventDate,
  formatArabicEventTimeRange,
  formatArabicNumber,
  formatEventPrice,
} from "@/lib/format/date";
import { createEventCatalog } from "@/lib/supabase/events";
import { registerForEventAction } from "@/app/(public)/events/[id]/actions";

export const metadata: Metadata = { title: "تفاصيل الفعالية" };
export const dynamic = "force-dynamic";

const audienceLabels: Record<EventAudience, string> = {
  adults: "الكبار",
  youth: "اليافعون",
  children: "الصغار",
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const catalog = await createEventCatalog();
  const event = await catalog.getUpcomingEvent(id);
  if (!event) notFound();

  return (
    <main className="page-shell section-space">
      <Link
        className="inline-flex min-h-11 items-center rounded-xl px-2 font-bold text-[var(--brand-green)] hover:bg-[var(--surface-soft)]"
        href="/events"
      >
        العودة إلى الفعاليات
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <article className="card-surface p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-sm font-extrabold text-[var(--brand-green)]">
              {audienceLabels[event.audience]}
            </span>
            <StatusBadge status={event.availability} />
          </div>

          <p className="eyebrow mt-8">{event.eventTypeLabel}</p>
          <h1 className="page-title mt-3">{event.title}</h1>
          <p className="mt-4 font-bold text-[var(--brand-green-deep)]">هذه الفعالية مخصصة للنساء.</p>

          <dl className="mt-9 grid gap-4 border-t border-[var(--border)] pt-7 sm:grid-cols-2">
            <div className="rounded-2xl bg-[var(--surface-soft)] p-4 sm:col-span-2">
              <dt className="text-sm muted-copy">الموعد</dt>
              <dd className="mt-1 text-lg font-extrabold">{formatArabicEventDate(event.startsAt)}</dd>
              <dd className="mt-1 font-bold text-[var(--brand-green-deep)]">{formatArabicEventTimeRange(event.startsAt, event.endsAt)}</dd>
            </div>
            <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
              <dt className="text-sm muted-copy">السعة</dt>
              <dd className="mt-1 font-extrabold">{formatArabicNumber(event.capacity)} مقعدًا</dd>
            </div>
            <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
              <dt className="text-sm muted-copy">السعر</dt>
              <dd className="mt-1 font-extrabold">{formatEventPrice(event.priceHalalas)}</dd>
            </div>
          </dl>
        </article>

        <aside className="card-surface p-6">
          {event.endsAt !== null && event.priceHalalas !== null && event.availability !== "closed" ? (
            <EventRegistrationForm
              action={registerForEventAction.bind(null, event.id, event.audience)}
              audience={event.audience}
              availability={event.availability}
            />
          ) : (
            <div role="status">
              <h2 className="text-xl font-extrabold text-[var(--brand-green-deep)]">التسجيل</h2>
              <p className="mt-3 muted-copy">التسجيل غير متاح لهذه الفعالية حاليًا.</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
