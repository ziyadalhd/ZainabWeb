import type { Metadata } from "next";
import Link from "next/link";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { RegistrationTable } from "@/features/admin/components/RegistrationTable";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Registration } from "@/lib/domain/types";
import { formatArabicNumber } from "@/lib/format/date";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";
import {
  cancelRegistrationAction,
  confirmAttendanceAction,
  recordCheckInAction,
  revokeInvitationAction,
  setRegistrationPaymentStatusAction,
} from "@/app/(dashboard)/admin/(protected)/registrations/actions";

export const metadata: Metadata = { title: "التسجيلات" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RegistrationView = "upcoming" | "waitlist" | "previous";

const views: ReadonlyArray<{ id: RegistrationView; label: string }> = [
  { id: "upcoming", label: "القادمة" },
  { id: "waitlist", label: "الانتظار والدعوات" },
  { id: "previous", label: "السابقة والملغاة" },
];

const registrationActions = {
  cancelRegistration: cancelRegistrationAction,
  confirmAttendance: confirmAttendanceAction,
  recordCheckIn: recordCheckInAction,
  revokeInvitation: revokeInvitationAction,
  setPaymentStatus: setRegistrationPaymentStatusAction,
};

function getView(value: string | undefined): RegistrationView {
  return views.some((view) => view.id === value) ? (value as RegistrationView) : "upcoming";
}

const pageSize = 25;

function getPage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function pageHref(view: RegistrationView, query: string, eventId: string | null, page: number): string {
  const params = new URLSearchParams({ view, page: String(page) });
  if (query) params.set("q", query);
  if (eventId) params.set("event", eventId);
  return `/admin/registrations?${params.toString()}`;
}

function registrationHref(registration: Registration, view: RegistrationView, query: string, eventId: string | null, page: number): string {
  const params = new URLSearchParams({ view, id: registration.id });
  if (query) params.set("q", query);
  if (eventId) params.set("event", eventId);
  if (page > 1) params.set("page", String(page));
  return `/admin/registrations?${params.toString()}`;
}

function clearEventHref(view: RegistrationView, query: string): string {
  const params = new URLSearchParams({ view });
  if (query) params.set("q", query);
  return `/admin/registrations?${params.toString()}`;
}

function viewHref(view: RegistrationView, query: string, eventId: string | null): string {
  const params = new URLSearchParams({ view });
  if (query) params.set("q", query);
  if (eventId) params.set("event", eventId);
  return `/admin/registrations?${params.toString()}`;
}

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; id?: string; q?: string; page?: string; event?: string }>;
}) {
  await requireAdmin();
  const { view: requestedView, id, q: requestedQuery, page: requestedPage, event: requestedEventId } = await searchParams;
  const view = getView(requestedView);
  const query = requestedQuery?.trim() ?? "";
  const eventId = requestedEventId?.trim() || null;
  const registrationRepository = await createAdminRegistrationRepository();
  const [outcome, eventOutcome] = await Promise.all([
    registrationRepository.listPage({ view, query, page: getPage(requestedPage), pageSize, now: new Date().toISOString(), eventId }),
    eventId ? createAdminEventRepository().then((repository) => repository.get(eventId)) : Promise.resolve(null),
  ]);
  const actionMode = view === "upcoming" ? "current" : view;

  return (
    <main className="admin-page">
      <PageHeader eyebrow="التشغيل" title="التسجيلات" />
      {eventId ? (
        <p className="notice-info mt-5">
          تُعرض تسجيلات فعالية واحدة فقط{eventOutcome ? ` — «${eventOutcome.title}»` : ""}.{" "}
          <Link href={clearEventHref(view, query)} className="font-bold underline decoration-current underline-offset-4">
            عرض كل التسجيلات
          </Link>
        </p>
      ) : null}
      <nav aria-label="حالات التسجيل" className="workspace-tabs mt-7">
        {views.map((item) => (
          <Link
            key={item.id}
            href={viewHref(item.id, query, eventId)}
            aria-current={item.id === view ? "page" : undefined}
            className={item.id === view ? "workspace-tab workspace-tab--active" : "workspace-tab"}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {outcome.ok ? (
        <>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <form action="/admin/registrations" className="flex min-w-[min(100%,22rem)] flex-1 flex-wrap gap-2">
              <input type="hidden" name="view" value={view} />
              {eventId ? <input type="hidden" name="event" value={eventId} /> : null}
              <label className="sr-only" htmlFor="registration-search">
                ابحثي في التسجيلات
              </label>
              <input
                id="registration-search"
                name="q"
                defaultValue={query}
                placeholder="الاسم أو الجوال أو الفعالية أو المرجع"
                className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
              />
              <button type="submit" className="button-primary">
                بحث
              </button>
              {query ? (
                <Link href={`/admin/registrations?view=${view}${eventId ? `&event=${eventId}` : ""}`} className="button-quiet">
                  مسح
                </Link>
              ) : null}
            </form>
            <p className="data-value text-sm font-bold muted-copy">{formatArabicNumber(outcome.data.total)} نتيجة</p>
          </div>
          <div className="mt-6">
            <RegistrationTable
              registrations={outcome.data.items}
              mode={actionMode}
              selectedId={id}
              registrationHref={(registration) => registrationHref(registration, view, query, eventId, outcome.data.page)}
              actions={registrationActions}
            />
          </div>
          {outcome.data.total > pageSize ? (
            <nav aria-label="ترقيم صفحات التسجيلات" className="mt-6 flex items-center justify-between gap-3">
              <p className="text-sm muted-copy">
                صفحة {formatArabicNumber(outcome.data.page)} من {formatArabicNumber(Math.ceil(outcome.data.total / pageSize))}
              </p>
              <div className="flex gap-2">
                {outcome.data.page > 1 ? (
                  <Link className="button-secondary" href={pageHref(view, query, eventId, outcome.data.page - 1)}>
                    السابقة
                  </Link>
                ) : null}
                {outcome.data.page * pageSize < outcome.data.total ? (
                  <Link className="button-secondary" href={pageHref(view, query, eventId, outcome.data.page + 1)}>
                    التالية
                  </Link>
                ) : null}
              </div>
            </nav>
          ) : null}
        </>
      ) : (
        <LoadErrorNotice />
      )}
    </main>
  );
}
