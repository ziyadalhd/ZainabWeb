import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PosterFrame } from "@/components/ui/PosterFrame";
import { EventRegistrationForm } from "@/features/events/components/EventRegistrationForm";
import { eventAvailabilityPresentation } from "@/features/events/event-presentation";
import type { EventAudience } from "@/lib/domain/types";
import {
  formatArabicEventDate,
  formatArabicEventTimeRange,
  formatEventPrice,
  formatSeatCapacity,
} from "@/lib/format/date";
import { createEventCatalog } from "@/lib/supabase/events";
import { registerForEventAction } from "@/app/(public)/events/[id]/actions";

export const dynamic = "force-dynamic";

const audienceLabels: Record<EventAudience, string> = {
  adults: "الكبار",
  youth: "اليافعون",
  children: "الصغار",
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getUpcomingEvent = cache(async (id: string) => {
  if (!uuidPattern.test(id)) return null;
  const catalog = await createEventCatalog();
  return catalog.getUpcomingEvent(id);
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await getUpcomingEvent(id);
  if (!event) {
    return {
      title: "الفعالية غير متاحة",
      robots: { index: false, follow: false },
      alternates: null,
    };
  }

  const description = `${event.eventTypeLabel} لفئة ${audienceLabels[event.audience]} في نادي بَيْن الثقافي.`;
  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.id}` },
    openGraph: {
      type: "website",
      title: event.title,
      description,
      url: `/events/${event.id}`,
      images: event.posterUrl ? [{ url: event.posterUrl, alt: `بوستر ${event.title}` }] : undefined,
    },
    twitter: {
      card: event.posterUrl ? "summary_large_image" : "summary",
      title: event.title,
      description,
      images: event.posterUrl ? [event.posterUrl] : undefined,
    },
  };
}

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();
  const event = await getUpcomingEvent(id);
  if (!event) notFound();
  const availability = eventAvailabilityPresentation[event.availability];

  return (
    <main className="page-shell section-space">
      <Link
        className="button-quiet"
        href="/events"
      >
        <span aria-hidden="true" className="ml-2">→</span> العودة إلى الفعاليات
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
        <article className="overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
          {event.posterUrl ? (
            <PosterFrame src={event.posterUrl} alt={`بوستر ${event.title}`} sizes="(min-width: 1024px) 66vw, 100vw" className="aspect-[4/5] w-full border-b border-[var(--color-border)] sm:aspect-[16/10]" priority />
          ) : null}
          <div className="p-5 sm:p-9">
            <div className="flex flex-wrap items-center gap-3">
              <span className="border-r-4 border-[var(--brand-amber)] pr-3 text-sm font-extrabold text-[var(--brand-forest)]">{audienceLabels[event.audience]}</span>
              <span className="text-sm font-extrabold text-[var(--brand-olive)]">{availability.status}</span>
            </div>
            <p className="eyebrow mt-8">{event.eventTypeLabel}</p>
            <h1 className="page-title mt-3">{event.title}</h1>
            <p className="mt-4 font-bold text-[var(--brand-forest)]">هذه الفعالية مخصصة للنساء.</p>
            <dl className="mt-9 grid border-y border-[var(--brand-olive)] sm:grid-cols-2">
              <div className="py-5 sm:col-span-2"><dt className="text-sm muted-copy">الموعد</dt><dd className="mt-1 text-xl font-black text-[var(--brand-forest)]">{formatArabicEventDate(event.startsAt)}</dd><dd className="mt-1 font-bold muted-copy">{formatArabicEventTimeRange(event.startsAt, event.endsAt)}</dd></div>
              <div className="border-t border-[var(--color-border)] py-5 sm:border-l sm:pl-5"><dt className="text-sm muted-copy">المقاعد</dt><dd className="data-value mt-1 font-extrabold">{formatSeatCapacity(event.capacity)}</dd></div>
              <div className="border-t border-[var(--color-border)] py-5 sm:pr-5"><dt className="text-sm muted-copy">السعر</dt><dd className="mt-1 font-extrabold">{formatEventPrice(event.priceHalalas)}</dd></div>
            </dl>
          </div>
        </article>

        <aside className="form-surface p-5 sm:p-6 lg:sticky lg:top-32">
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
