import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BookingActions } from "@/features/bookings/components/BookingActions";
import { formatArabicDateTime, formatEventPrice } from "@/lib/format/date";
import { createRegistrationService } from "@/lib/supabase/registrations";
import {
  cancelBookingAction,
  confirmBookingAttendanceAction,
} from "@/app/(public)/bookings/[token]/actions";

export const metadata: Metadata = { title: "إدارة الحجز" };
export const dynamic = "force-dynamic";

export default async function BookingManagementPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const service = await createRegistrationService();
  const booking = await service.getBooking(token);

  if (!booking) {
    return (
      <main className="page-shell section-space">
        <div className="mx-auto max-w-xl card-surface p-7 sm:p-10">
          <h1 className="page-title">رابط الحجز غير متاح</h1>
          <p className="mt-4 muted-copy">قد يكون الرابط منتهيًا، أو أُلغي الحجز، أو انتهت الفعالية.</p>
          <Link className="button-primary mt-6" href="/events">عرض الفعاليات</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell section-space">
      <article className="mx-auto max-w-2xl card-surface p-7 sm:p-10">
        <p className="eyebrow">إدارة الحجز</p>
        <h1 className="page-title mt-3">{booking.eventTitle}</h1>
        <p className="mt-3 font-bold">{booking.attendeeName}</p>

        <dl className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="border-r-4 border-[var(--brand-olive)] bg-[var(--color-surface-muted)] p-4">
            <dt className="text-sm muted-copy">الموعد</dt>
            <dd className="mt-1 font-extrabold">{formatArabicDateTime(booking.eventStartsAt)}</dd>
          </div>
          <div className="border-r-4 border-[var(--brand-olive)] bg-[var(--color-surface-muted)] p-4">
            <dt className="text-sm muted-copy">السعر وقت الحجز</dt>
            <dd className="mt-1 font-extrabold">{formatEventPrice(booking.priceHalalasAtBooking)}</dd>
          </div>
          <div className="border-r-4 border-[var(--brand-olive)] bg-[var(--color-surface-muted)] p-4">
            <dt className="text-sm muted-copy">حالة الحجز</dt>
            <dd className="mt-2"><StatusBadge status={booking.status} /></dd>
          </div>
          <div className="border-r-4 border-[var(--brand-olive)] bg-[var(--color-surface-muted)] p-4">
            <dt className="text-sm muted-copy">الحضور</dt>
            <dd className="mt-2"><StatusBadge status={booking.attendanceStatus} /></dd>
          </div>
        </dl>

        <BookingActions
          attendanceStatus={booking.attendanceStatus}
          status={booking.status}
          confirmAction={confirmBookingAttendanceAction.bind(null, token)}
          cancelAction={cancelBookingAction.bind(null, token)}
        />
      </article>
    </main>
  );
}
