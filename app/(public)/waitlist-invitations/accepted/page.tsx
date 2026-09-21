import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "قبلتِ الدعوة", robots: { index: false, follow: false }, alternates: null };

export default function WaitlistInvitationAcceptedPage() {
  return (
    <main className="page-shell section-space">
      <div role="status" className="mx-auto max-w-xl card-surface p-7 sm:p-10">
        <h1 className="page-title">قبلتِ الدعوة</h1>
        <p className="mt-4 muted-copy">مقعدك مؤكد. استخدمي رابط إدارة الحجز الذي ظهر عند تسجيلك الأول لتأكيد الحضور أو الإلغاء.</p>
        <Link className="button-primary mt-6" href="/events">عرض الفعاليات</Link>
      </div>
    </main>
  );
}
