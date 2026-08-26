import type { Metadata } from "next";
import Link from "next/link";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { AdminServiceRequest, ServiceRequestConflict, ServiceRequestKind } from "@/lib/domain/types";
import { formatArabicDateTime, formatArabicNumber, formatArabicRequestedSchedule } from "@/lib/format/date";
import { createAdminServiceRequestRepository } from "@/lib/supabase/service-requests";
import { markServiceRequestContactedAction } from "@/app/(dashboard)/admin/(protected)/requests/actions";

export const metadata: Metadata = { title: "الطلبات" };
export const dynamic = "force-dynamic";
export const revalidate = 0;
const pageSize = 25;

function getKind(value: string | undefined): "all" | "space_booking" | "workshop_application" {
  return value === "space_booking" || value === "workshop_application" ? value : "all";
}
function requestTitle(request: AdminServiceRequest): string {
  return request.kind === "workshop_application" ? request.workshopTitle || "طلب ورشة" : request.useOrOccasionType || "طلب حجز مساحة";
}
function requestKindLabel(kind: ServiceRequestKind): string {
  return kind === "workshop_application" ? "طلب ورشة" : kind === "space_booking" ? "حجز مساحة" : "طلب قديم";
}
function pageHref(kind: "all" | "space_booking" | "workshop_application", query: string, page: number): string {
  const params = new URLSearchParams({ page: String(page) });
  if (kind !== "all") params.set("kind", kind);
  if (query) params.set("q", query);
  return `/admin/requests?${params.toString()}`;
}

function ConflictWarning({ conflicts }: { conflicts: readonly ServiceRequestConflict[] }) {
  if (conflicts.length === 0) return null;
  return (
    <div className="notice-warning mt-5" role="status">
      <p className="font-black">تعارض في الموعد</p>
      <ul className="mt-2 grid gap-1 text-sm">
        {conflicts.map((conflict, index) => (
          <li key={index}>
            {conflict.title} — {formatArabicDateTime(conflict.startsAt)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs">هذا تنبيه فقط، ولن يمنع قبول الطلب.</p>
    </div>
  );
}

function RequestCard({ request, conflicts }: { request: AdminServiceRequest; conflicts: readonly ServiceRequestConflict[] }) {
  const workshop = request.kind === "workshop_application";
  return (
    <article className="card-surface p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">{requestKindLabel(request.kind)}</p>
          <h2 className="mt-2 break-words text-2xl font-black text-[var(--brand-forest)]">{requestTitle(request)}</h2>
          <p className="mt-2 text-sm muted-copy">وصل الطلب {formatArabicDateTime(request.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="button-primary" href={`https://wa.me/${request.phoneE164.replace(/^\+/, "")}`} target="_blank" rel="noreferrer">
            فتح واتساب
          </a>
          {!request.contactedAt ? (
            <ActionButton
              action={markServiceRequestContactedAction.bind(null, request.id)}
              label="تم التواصل"
              pendingLabel="جارٍ الحفظ…"
              className="button-secondary"
              successMessage="تم تسجيل التواصل."
            />
          ) : (
            <span className="text-sm font-bold text-[var(--color-success-text)]">تم التواصل</span>
          )}
        </div>
      </div>
      <ConflictWarning conflicts={conflicts} />
      <div className="mt-6 grid gap-5 border-y border-[var(--color-border)] py-5 text-sm sm:grid-cols-2">
        <div>
          <p className="muted-copy">مقدمة الطلب</p>
          <p className="mt-1 font-bold">{request.requesterName}</p>
          <p className="data-value mt-2 text-xs font-bold" dir="ltr">
            {request.phoneE164}
          </p>
          {request.email ? (
            <a
              className="mt-2 block w-fit break-all text-xs font-bold underline decoration-[var(--brand-olive)] underline-offset-4"
              href={`mailto:${request.email}`}
              dir="ltr"
            >
              {request.email}
            </a>
          ) : null}
        </div>
        {workshop ? (
          <div>
            <p className="muted-copy">تفاصيل الورشة</p>
            <p className="mt-1 font-bold">{request.workshopTargetAudience || "—"}</p>
            <p className="mt-1 text-sm muted-copy">المدة: {request.workshopDuration || "—"}</p>
          </div>
        ) : (
          <div>
            <p className="muted-copy">الموعد المطلوب</p>
            <p className="mt-1 font-bold">{formatArabicRequestedSchedule(request.requestedDate, request.requestedStartTime, request.requestedEndTime)}</p>
            <p className="mt-1 text-sm muted-copy">الحضور المتوقع: {request.attendeeCount === null ? "—" : formatArabicNumber(request.attendeeCount)}</p>
          </div>
        )}
      </div>
      {workshop ? (
        <div className="mt-5 grid gap-4 text-sm">
          <div>
            <p className="muted-copy">وصف الورشة</p>
            <p className="mt-1 whitespace-pre-wrap font-bold">{request.workshopDescription || "—"}</p>
          </div>
          <div>
            <p className="muted-copy">المتطلبات</p>
            <p className="mt-1 whitespace-pre-wrap font-bold">{request.workshopRequirements || "—"}</p>
          </div>
          {request.workshopPortfolioUrl ? (
            <a
              className="w-fit break-all text-sm font-bold underline decoration-[var(--brand-olive)] underline-offset-4"
              href={request.workshopPortfolioUrl}
              target="_blank"
              rel="noreferrer"
            >
              فتح رابط الخبرة أو الملف
            </a>
          ) : null}
        </div>
      ) : null}
      {request.notes ? (
        <div className="mt-5 border-r-4 border-[var(--brand-olive)] bg-[var(--surface-soft)] p-4 text-sm">
          <p className="font-bold">ملاحظات</p>
          <p className="mt-2 whitespace-pre-wrap">{request.notes}</p>
        </div>
      ) : null}
    </article>
  );
}

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string; page?: string }> }) {
  await requireAdmin();
  const { q: rawQuery, kind: rawKind, page: rawPage } = await searchParams;
  const query = rawQuery?.trim() ?? "";
  const kind = getKind(rawKind);
  const page = Number.isInteger(Number(rawPage)) && Number(rawPage) > 0 ? Number(rawPage) : 1;
  const repository = await createAdminServiceRequestRepository();
  const outcome = await repository.listPage({ query, kind, status: "all", page, pageSize });

  const conflictsById = new Map<string, readonly ServiceRequestConflict[]>();
  if (outcome.ok) {
    const bookingRequests = outcome.data.items.filter((request) => request.kind !== "workshop_application");
    const conflictResults = await Promise.all(bookingRequests.map((request) => repository.getConflicts(request.id)));
    bookingRequests.forEach((request, index) => {
      const result = conflictResults[index]!;
      conflictsById.set(request.id, result.ok ? result.data : []);
    });
  }

  return (
    <main className="admin-page">
      <PageHeader eyebrow="صندوق الوارد" title="الطلبات" description="راجعي التفاصيل ثم تواصلي مباشرة عبر واتساب. لا توجد إجراءات أخرى داخل الموقع." />
      <form action="/admin/requests" className="request-filter-bar mt-7">
        <label className="sr-only" htmlFor="request-search">
          البحث في الطلبات
        </label>
        <input
          id="request-search"
          name="q"
          defaultValue={query}
          placeholder="الاسم أو الجوال أو عنوان الطلب…"
          className="field-control min-h-11 min-w-0 flex-1"
        />
        <label className="sr-only" htmlFor="request-kind">
          نوع الطلب
        </label>
        <select id="request-kind" name="kind" defaultValue={kind} className="field-control min-h-11">
          <option value="all">كل الطلبات</option>
          <option value="space_booking">حجز مساحة</option>
          <option value="workshop_application">طلب ورشة</option>
        </select>
        <button type="submit" className="button-primary">
          بحث
        </button>
        {query || kind !== "all" ? (
          <Link href="/admin/requests" className="button-quiet">
            مسح
          </Link>
        ) : null}
      </form>
      {outcome.ok ? (
        <>
          <p className="mt-5 text-sm font-bold muted-copy">{formatArabicNumber(outcome.data.total)} طلبات</p>
          <div className="mt-4 grid gap-5">
            {outcome.data.items.map((request) => (
              <RequestCard key={request.id} request={request} conflicts={conflictsById.get(request.id) ?? []} />
            ))}
          </div>
          {outcome.data.total === 0 ? <section className="card-surface mt-5 p-8 text-center muted-copy">لا توجد طلبات تطابق بحثك.</section> : null}
          {outcome.data.total > pageSize ? (
            <nav aria-label="ترقيم صفحات الطلبات" className="mt-6 flex items-center justify-between gap-3">
              <p className="text-sm muted-copy">
                صفحة {formatArabicNumber(outcome.data.page)} من {formatArabicNumber(Math.ceil(outcome.data.total / pageSize))}
              </p>
              <div className="flex gap-2">
                {outcome.data.page > 1 ? (
                  <Link className="button-secondary" href={pageHref(kind, query, outcome.data.page - 1)}>
                    السابقة
                  </Link>
                ) : null}
                {outcome.data.page * pageSize < outcome.data.total ? (
                  <Link className="button-secondary" href={pageHref(kind, query, outcome.data.page + 1)}>
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
