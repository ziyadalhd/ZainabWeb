import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "تم إلغاء الحجز" };

export default function BookingCancelledPage() {
  return (
    <main className="page-shell section-space">
      <div role="status" className="mx-auto max-w-xl card-surface p-7 sm:p-10">
        <h1 className="page-title">تم إلغاء الحجز</h1>
        <p className="mt-4 muted-copy">تم تحرير المقعد وإيقاف التذكيرات لهذا الحجز، ولم يعد رابط الإدارة السابق صالحًا.</p>
        <Link className="button-primary mt-6" href="/events">عرض الفعاليات</Link>
      </div>
    </main>
  );
}
