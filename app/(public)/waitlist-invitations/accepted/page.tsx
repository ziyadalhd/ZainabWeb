import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "تم قبول الدعوة" };

export default function WaitlistInvitationAcceptedPage() {
  return (
    <main className="page-shell section-space">
      <div role="status" className="mx-auto max-w-xl card-surface p-7 sm:p-10">
        <h1 className="page-title">تم قبول الدعوة</h1>
        <p className="mt-4 muted-copy">تم تأكيد المقعد. استخدمي رابط إدارة الحجز الذي ظهر عند التسجيل الأول لتأكيد الحضور أو الإلغاء.</p>
        <Link className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--brand-green)] px-4 py-2 font-bold text-white" href="/events">عرض الفعاليات</Link>
      </div>
    </main>
  );
}
