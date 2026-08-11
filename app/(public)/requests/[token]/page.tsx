import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { cancelServiceRequestAction, respondToServiceRequestOfferAction } from "@/app/(public)/requests/[token]/actions";
import { ServiceRequestCancelAction } from "@/features/requests/components/ServiceRequestCancelAction";
import { ServiceRequestOfferResponseAction } from "@/features/requests/components/ServiceRequestOfferResponseAction";
import { formatArabicDateTime, formatEventPrice } from "@/lib/format/date";
import { createServiceRequestService } from "@/lib/supabase/service-requests";

interface ServiceRequestManagementPageProps {
  params: Promise<{ token: string }>;
}

const labels = { space_booking: "طلب حجز المساحة", celebration_booking: "طلب إقامة حفل", workshop_application: "طلب تقديم ورشة" };
const statuses = { new: "جديد", under_review: "قيد المراجعة", accepted: "مقبول", rejected: "مرفوض", cancelled: "ملغى" };

export default async function ServiceRequestManagementPage({ params }: ServiceRequestManagementPageProps) {
  const { token } = await params;
  const service = await createServiceRequestService();
  const request = await service.getByToken(token);
  if (!request) notFound();
  const booking = request.kind !== "workshop_application";
  const hasActiveOffer = booking
    && request.status === "under_review"
    && request.offerPriceHalalas !== null
    && request.offerTerms !== null
    && request.offerExpiresAt !== null
    && new Date(request.offerExpiresAt) > new Date();
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="متابعة الطلب" title={labels[request.kind]} description="هذا الرابط مخصص لمتابعة طلبك فقط." />
      <section className="card-surface mt-8 max-w-3xl p-6 sm:p-8">
        <p className="rounded-xl bg-[var(--surface-soft)] px-4 py-3 text-sm font-extrabold">الحالة: {statuses[request.status]}</p>
        <h2 className="mt-6 text-xl font-extrabold">بيانات الطلب</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="muted-copy">الاسم</dt><dd className="mt-1 font-bold">{request.requesterName}</dd></div>
          {booking ? <><div><dt className="muted-copy">الاستخدام أو المناسبة</dt><dd className="mt-1 font-bold">{request.useOrOccasionType}</dd></div><div><dt className="muted-copy">التاريخ</dt><dd className="mt-1 font-bold">{request.requestedDate}</dd></div><div><dt className="muted-copy">الوقت</dt><dd className="mt-1 font-bold">{request.requestedStartTime} – {request.requestedEndTime}</dd></div><div><dt className="muted-copy">عدد الحاضرات</dt><dd className="mt-1 font-bold">{request.attendeeCount}</dd></div></> : <><div><dt className="muted-copy">عنوان الورشة</dt><dd className="mt-1 font-bold">{request.workshopTitle}</dd></div><div><dt className="muted-copy">الفئة المستهدفة</dt><dd className="mt-1 font-bold">{request.workshopTargetAudience}</dd></div><div><dt className="muted-copy">المدة</dt><dd className="mt-1 font-bold">{request.workshopDuration}</dd></div><div><dt className="muted-copy">الحضور المتوقع</dt><dd className="mt-1 font-bold">{request.workshopExpectedAttendance}</dd></div></>}
        </dl>
        {request.notes ? <p className="mt-5 rounded-2xl bg-[var(--surface-soft)] p-4 text-sm">{request.notes}</p> : null}
        {hasActiveOffer ? (
          <section className="mt-7 rounded-2xl border border-[var(--brand-green)] bg-[var(--surface-soft)] p-5" aria-labelledby="offer-title">
            <h2 id="offer-title" className="text-xl font-extrabold text-[var(--brand-green-deep)]">عرض النادي</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="muted-copy">السعر</dt><dd className="mt-1 font-extrabold">{formatEventPrice(request.offerPriceHalalas)}</dd></div>
              <div><dt className="muted-copy">صالح حتى</dt><dd className="mt-1 font-extrabold">{formatArabicDateTime(request.offerExpiresAt!)}</dd></div>
            </dl>
            <div className="mt-4 whitespace-pre-wrap rounded-xl bg-white/70 p-4 text-sm leading-7">{request.offerTerms}</div>
            <div className="mt-5"><ServiceRequestOfferResponseAction acceptAction={respondToServiceRequestOfferAction.bind(null, token, "accepted")} rejectAction={respondToServiceRequestOfferAction.bind(null, token, "rejected")} /></div>
          </section>
        ) : null}
        {booking && request.status === "under_review" && request.offerExpiresAt && new Date(request.offerExpiresAt) <= new Date() ? <p className="mt-6 rounded-xl bg-[var(--color-error-bg)] px-4 py-3 text-sm font-bold text-[var(--color-error-text)]">انتهت صلاحية العرض. يمكن للإدارة إصدار عرض جديد من رابط المتابعة نفسه.</p> : null}
        {request.status !== "cancelled" ? <div className="mt-7 border-t border-[var(--border)] pt-5"><ServiceRequestCancelAction action={cancelServiceRequestAction.bind(null, token)} /></div> : null}
      </section>
    </main>
  );
}
