import type { Metadata } from "next";
import Link from "next/link";
import { AdminSearchForm } from "@/components/navigation/AdminSearchForm";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { matchEvents, matchRequests, requestTitle } from "@/features/admin/admin-search";
import { requireAdmin } from "@/lib/auth/require-admin";
import { formatArabicEventDate } from "@/lib/format/date";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";
import { createAdminServiceRequestRepository } from "@/lib/supabase/service-requests";

export const metadata: Metadata = { title: "البحث" };
export const dynamic = "force-dynamic";

const resultLimit = 8;

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  return (
    <main className="admin-page">
      <PageHeader eyebrow="بحث عام" title="نتائج البحث" />
      <AdminSearchForm className="mt-6 flex max-w-xl flex-wrap gap-2" inputClassName="field-control min-h-11 min-w-0 flex-1" />
      {query ? <AdminSearchResults query={query} /> : <p className="mt-6 text-sm muted-copy">اكتبي اسمًا أو رقم جوال أو عنوان فعالية للبدء.</p>}
    </main>
  );
}

async function AdminSearchResults({ query }: { query: string }) {
  const [eventRepository, requestRepository, registrationRepository] = await Promise.all([
    createAdminEventRepository(),
    createAdminServiceRequestRepository(),
    createAdminRegistrationRepository(),
  ]);
  const [eventsOutcome, requestsOutcome, registrationsOutcome] = await Promise.all([
    eventRepository.list(),
    requestRepository.list(),
    registrationRepository.listPage({ view: "upcoming", query, page: 1, pageSize: resultLimit, now: new Date().toISOString(), eventId: null }),
  ]);

  const matchingEvents = eventsOutcome.ok ? matchEvents(eventsOutcome.data, query, resultLimit) : null;
  const matchingRequests = requestsOutcome.ok ? matchRequests(requestsOutcome.data, query, resultLimit) : null;
  const matchingRegistrations = registrationsOutcome.ok ? registrationsOutcome.data.items : null;

  const totalMatches = (matchingEvents?.length ?? 0) + (matchingRequests?.length ?? 0) + (matchingRegistrations?.length ?? 0);

  return (
    <div className="mt-8 grid gap-8">
      {totalMatches === 0 && matchingEvents && matchingRequests && matchingRegistrations ? (
        <p className="text-sm muted-copy">لا توجد نتائج مطابقة لـ«{query}».</p>
      ) : null}

      <section aria-labelledby="search-events-heading">
        <h2 id="search-events-heading" className="text-lg font-bold text-[var(--brand-forest)]">
          الفعاليات
        </h2>
        <div className="mt-3 card-surface divide-y divide-[var(--color-border)]">
          {matchingEvents === null ? (
            <LoadErrorNotice />
          ) : matchingEvents.length ? (
            matchingEvents.map((event) => (
              <Link key={event.id} href={`/admin/events?event=${event.id}`} className="activity-item">
                <span>
                  <strong>{event.title}</strong>
                  <small>{event.eventTypeLabel}</small>
                </span>
                <time>{formatArabicEventDate(event.startsAt)}</time>
              </Link>
            ))
          ) : (
            <p className="px-5 py-6 text-sm muted-copy">لا توجد فعاليات مطابقة.</p>
          )}
        </div>
      </section>

      <section aria-labelledby="search-requests-heading">
        <h2 id="search-requests-heading" className="text-lg font-bold text-[var(--brand-forest)]">
          الطلبات
        </h2>
        <div className="mt-3 card-surface divide-y divide-[var(--color-border)]">
          {matchingRequests === null ? (
            <LoadErrorNotice />
          ) : matchingRequests.length ? (
            matchingRequests.map((request) => (
              <Link key={request.id} href={`/admin/requests?q=${encodeURIComponent(request.requesterName)}`} className="activity-item">
                <span>
                  <strong>{request.requesterName}</strong>
                  <small>{requestTitle(request)}</small>
                </span>
              </Link>
            ))
          ) : (
            <p className="px-5 py-6 text-sm muted-copy">لا توجد طلبات مطابقة.</p>
          )}
        </div>
      </section>

      <section aria-labelledby="search-registrations-heading">
        <h2 id="search-registrations-heading" className="text-lg font-bold text-[var(--brand-forest)]">
          التسجيلات
        </h2>
        <div className="mt-3 card-surface divide-y divide-[var(--color-border)]">
          {matchingRegistrations === null ? (
            <LoadErrorNotice />
          ) : matchingRegistrations.length ? (
            matchingRegistrations.map((registration) => (
              <Link key={registration.id} href={`/admin/registrations?view=upcoming&id=${registration.id}`} className="activity-item">
                <span>
                  <strong>{registration.attendeeName}</strong>
                  <small>{registration.eventTitle}</small>
                </span>
              </Link>
            ))
          ) : (
            <p className="px-5 py-6 text-sm muted-copy">لا توجد تسجيلات قادمة مطابقة.</p>
          )}
        </div>
        <p className="mt-2 text-xs muted-copy">يشمل البحث هنا التسجيلات القادمة فقط. لمراجعة التسجيلات السابقة، استخدمي صفحة التسجيلات.</p>
      </section>
    </div>
  );
}
