import { PageHeader } from "@/components/ui/PageHeader";
import {
  createServiceRequestOfferAction,
  setServiceRequestPaymentStatusAction,
  startServiceRequestReviewAction,
} from "@/app/(dashboard)/admin/(protected)/requests/actions";
import { ServiceRequestOfferForm } from "@/features/requests/components/ServiceRequestOfferForm";
import { ServiceRequestPaymentStatusForm } from "@/features/requests/components/ServiceRequestPaymentStatusForm";
import { formatArabicDateTime, formatArabicNumber, formatArabicRequestedSchedule, formatEventPrice } from "@/lib/format/date";
import { createAdminServiceRequestRepository } from "@/lib/supabase/service-requests";

const kindLabels = { space_booking: "حجز مساحة", celebration_booking: "إقامة حفل", workshop_application: "طلب ورشة" };
const statusLabels = { new: "جديد", under_review: "قيد المراجعة", accepted: "مقبول", rejected: "مرفوض", cancelled: "ملغى" };
const paymentLabels = { unpaid: "غير مدفوع", deposit_paid: "دُفع العربون", paid_in_full: "مدفوع بالكامل" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminRequestsPage() {
  const repository = await createAdminServiceRequestRepository();
  const requests = await repository.list();
  const conflicts = await Promise.all(requests.map(async (request) => request.kind === "workshop_application" ? [] : repository.getConflicts(request.id)));
  return (
    <main className="admin-page">
      <PageHeader eyebrow="إدارة الطلبات" title="طلبات الحجز والورش" description="راجعي كل طلب، وتأكدي من الموعد، ثم جهّزي العرض المناسب لصاحبته." />
      {requests.length === 0 ? <section className="card-surface mt-8 p-8 text-center muted-copy">لا توجد طلبات حاليًا.</section> : <section className="mt-8 grid gap-5">{requests.map((request, index) => {
        const booking = request.kind !== "workshop_application";
        const requestConflicts = conflicts[index] ?? [];
        return <article key={request.id} className="card-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-sm font-bold text-[var(--brand-green-deep)]">{kindLabels[request.kind]}</p><h2 className="mt-1 text-xl font-extrabold">{request.kind === "workshop_application" ? request.workshopTitle : request.useOrOccasionType}</h2><p className="mt-1 text-xs muted-copy" dir="ltr">{request.reference}</p></div>
            <span className="rounded-sm border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1 text-sm font-extrabold">{statusLabels[request.status]}</span>
          </div>
          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="muted-copy">مقدمة الطلب</p>
              <p className="mt-1 font-bold">{request.requesterName}</p>
              <a className="data-value mt-2 block w-fit text-xs font-bold underline decoration-[var(--brand-olive)] underline-offset-4" href={`https://wa.me/${request.phoneE164.replace("+", "")}`} target="_blank" rel="noreferrer">{request.phoneE164}</a>
              {request.email ? <a className="mt-2 block w-fit max-w-full break-all text-xs font-bold underline decoration-[var(--brand-olive)] underline-offset-4" href={`mailto:${request.email}`} dir="ltr">{request.email}</a> : null}
              <p className="mt-2 text-xs muted-copy">وصل الطلب {formatArabicDateTime(request.createdAt)}</p>
            </div>
            {booking ? <div><p className="muted-copy">الموعد المطلوب</p><p className="mt-1 font-bold">{formatArabicRequestedSchedule(request.requestedDate, request.requestedStartTime, request.requestedEndTime)}</p><p className="mt-1 text-xs muted-copy">الحضور المتوقع: {request.attendeeCount === null ? "—" : formatArabicNumber(request.attendeeCount)}</p></div> : null}
            {booking && request.status === "accepted" ? <div><p className="muted-copy">حالة الدفع</p><p className="mt-1 font-bold">{paymentLabels[request.paymentStatus]}</p></div> : null}
            {booking && request.offerPriceHalalas !== null ? <div><p className="muted-copy">العرض الحالي</p><p className="mt-1 font-bold">{formatEventPrice(request.offerPriceHalalas)}</p><p className="mt-1 text-xs muted-copy">حتى {request.offerExpiresAt ? formatArabicDateTime(request.offerExpiresAt) : "—"}</p></div> : null}
          </div>
          {!booking ? (
            <section className="mt-5 grid gap-4 border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:grid-cols-2" aria-label="تفاصيل الورشة">
              <div className="sm:col-span-2"><p className="text-xs font-bold muted-copy">وصف الورشة</p><p className="mt-1 whitespace-pre-wrap font-bold">{request.workshopDescription ?? "—"}</p></div>
              <div><p className="text-xs font-bold muted-copy">الفئة المستهدفة</p><p className="mt-1 font-bold">{request.workshopTargetAudience ?? "—"}</p></div>
              <div><p className="text-xs font-bold muted-copy">المدة</p><p className="mt-1 font-bold">{request.workshopDuration ?? "—"}</p></div>
              <div><p className="text-xs font-bold muted-copy">الحضور المتوقع</p><p className="mt-1 font-bold">{request.workshopExpectedAttendance === null ? "—" : formatArabicNumber(request.workshopExpectedAttendance)}</p></div>
              <div><p className="text-xs font-bold muted-copy">رابط الخبرة أو الملف</p>{request.workshopPortfolioUrl ? <a className="mt-1 block break-all font-bold underline decoration-[var(--brand-olive)] underline-offset-4" href={request.workshopPortfolioUrl} target="_blank" rel="noreferrer" dir="ltr">فتح الرابط</a> : <p className="mt-1 font-bold">—</p>}</div>
              <div className="sm:col-span-2"><p className="text-xs font-bold muted-copy">المتطلبات</p><p className="mt-1 whitespace-pre-wrap font-bold">{request.workshopRequirements ?? "—"}</p></div>
            </section>
          ) : null}
          {request.notes ? <p className="mt-5 whitespace-pre-wrap border-r-4 border-[var(--brand-olive)] bg-[var(--surface-soft)] p-4 text-sm">{request.notes}</p> : null}
          {booking && requestConflicts.length > 0 ? <aside className="notice-error mt-5 border border-[var(--color-error-text)] p-4" aria-label="تحذير تعارض المواعيد"><p className="font-extrabold">تحذير: الموعد المطلوب يتداخل مع عناصر في تقويم النادي</p><ul className="mt-3 grid gap-2 text-sm">{requestConflicts.map((conflict) => <li key={`${conflict.source}-${conflict.title}-${conflict.startsAt}`}><span className="font-bold">{conflict.source === "event" ? "فعالية" : "طلب آخر"}: {conflict.title}</span><span className="mr-2 text-[var(--color-text-muted)]">{formatArabicDateTime(conflict.startsAt)} – {formatArabicDateTime(conflict.endsAt)} ({conflict.status === "accepted" ? "مقبول" : conflict.status === "under_review" ? "قيد المراجعة" : conflict.status === "published" ? "منشور" : "مسودة"})</span></li>)}</ul><p className="mt-3 text-xs font-bold">راجعي التقويم قبل إصدار العرض؛ يمكنك المتابعة إذا كان التعارض مقصودًا.</p></aside> : null}
          <div className="mt-6 grid gap-4 border-t border-[var(--border)] pt-5">
            {request.status === "new" ? <form action={startServiceRequestReviewAction.bind(null, request.id)}><button type="submit" className="button-secondary px-4 py-2 text-sm">بدء المراجعة</button></form> : null}
            {booking && (request.status === "new" || request.status === "under_review") ? <ServiceRequestOfferForm action={createServiceRequestOfferAction.bind(null, request.id)} priceHalalas={request.offerPriceHalalas} terms={request.offerTerms} expiresAt={request.offerExpiresAt} /> : null}
            {booking && request.status === "accepted" ? <ServiceRequestPaymentStatusForm action={setServiceRequestPaymentStatusAction.bind(null, request.id)} currentStatus={request.paymentStatus} /> : null}
          </div>
        </article>;
      })}</section>}
    </main>
  );
}
