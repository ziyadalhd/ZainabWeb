import { PageHeader } from "@/components/ui/PageHeader";
import { startServiceRequestReviewAction } from "@/app/(dashboard)/admin/(protected)/requests/actions";
import { createAdminServiceRequestRepository } from "@/lib/supabase/service-requests";

const kindLabels = { space_booking: "حجز مساحة", celebration_booking: "إقامة حفل", workshop_application: "طلب ورشة" };
const statusLabels = { new: "جديد", under_review: "قيد المراجعة", accepted: "مقبول", rejected: "مرفوض", cancelled: "ملغى" };

export default async function AdminRequestsPage() {
  const repository = await createAdminServiceRequestRepository();
  const requests = await repository.list();
  return (
    <main className="section-space px-4 sm:px-6 lg:px-8">
      <PageHeader eyebrow="إدارة الطلبات" title="طلبات الحجز والورش" description="طلبات قيد المراجعة؛ لا يُعد أي طلب حجزًا مؤكدًا قبل أن تقرره الإدارة." />
      {requests.length === 0 ? <section className="card-surface mt-8 p-8 text-center muted-copy">لا توجد طلبات حاليًا.</section> : <section className="card-surface mt-8 overflow-x-auto"><table className="w-full min-w-[48rem] text-right text-sm"><thead className="border-b border-[var(--border)] text-[var(--text-muted)]"><tr><th className="px-5 py-4 font-bold">الطلب</th><th className="px-5 py-4 font-bold">مقدمة الطلب</th><th className="px-5 py-4 font-bold">التفاصيل</th><th className="px-5 py-4 font-bold">الحالة</th><th className="px-5 py-4 font-bold">إجراء</th></tr></thead><tbody>{requests.map((request) => <tr key={request.id} className="border-b border-[var(--border)] last:border-0"><td className="px-5 py-4 font-bold">{kindLabels[request.kind]}</td><td className="px-5 py-4"><p className="font-bold">{request.requesterName}</p><p className="mt-1 text-xs muted-copy" dir="ltr">{request.phoneE164}</p></td><td className="px-5 py-4">{request.kind === "workshop_application" ? request.workshopTitle : <><p>{request.useOrOccasionType}</p><p className="mt-1 text-xs muted-copy">{request.requestedDate} · {request.requestedStartTime}–{request.requestedEndTime}</p></>}</td><td className="px-5 py-4 font-bold">{statusLabels[request.status]}</td><td className="px-5 py-4">{request.status === "new" ? <form action={startServiceRequestReviewAction.bind(null, request.id)}><button type="submit" className="min-h-10 rounded-xl border border-[var(--brand-green)] px-3 py-2 font-bold text-[var(--brand-green-deep)]">بدء المراجعة</button></form> : "—"}</td></tr>)}</tbody></table></section>}
    </main>
  );
}
