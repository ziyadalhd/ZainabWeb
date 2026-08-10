import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { cancelServiceRequestAction } from "@/app/(public)/requests/[token]/actions";
import { ServiceRequestCancelAction } from "@/features/requests/components/ServiceRequestCancelAction";
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
        {request.status !== "cancelled" ? <div className="mt-7 border-t border-[var(--border)] pt-5"><ServiceRequestCancelAction action={cancelServiceRequestAction.bind(null, token)} /></div> : null}
      </section>
    </main>
  );
}
