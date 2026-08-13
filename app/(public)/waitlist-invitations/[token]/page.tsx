import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistInvitationAction } from "@/features/bookings/components/WaitlistInvitationAction";
import { formatArabicDateTime } from "@/lib/format/date";
import { createRegistrationService } from "@/lib/supabase/registrations";
import { acceptWaitlistInvitationAction } from "@/app/(public)/waitlist-invitations/[token]/actions";

export const metadata: Metadata = { title: "دعوة قائمة الانتظار", robots: { index: false, follow: false }, alternates: null };
export const dynamic = "force-dynamic";

export default async function WaitlistInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const service = await createRegistrationService();
  const invitation = await service.getWaitlistInvitation(token);

  if (!invitation) {
    return (
      <main className="page-shell section-space">
        <div className="mx-auto max-w-xl card-surface p-7 sm:p-10">
          <h1 className="page-title">الدعوة غير متاحة</h1>
          <p className="mt-4 muted-copy">قد تكون الدعوة منتهية، أو سُحبت، أو قُبلت سابقًا.</p>
          <Link className="button-primary mt-6" href="/events">عرض الفعاليات</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell section-space">
      <article className="mx-auto max-w-xl card-surface p-7 sm:p-10">
        <p className="eyebrow">دعوة من قائمة الانتظار</p>
        <h1 className="page-title mt-3">{invitation.eventTitle}</h1>
        <p className="mt-4 font-bold">{invitation.attendeeName}</p>
        <dl className="mt-7 grid gap-4">
          <div className="border-r-4 border-[var(--brand-olive)] bg-[var(--color-surface-muted)] p-4">
            <dt className="text-sm muted-copy">موعد الفعالية</dt>
            <dd className="mt-1 font-extrabold">{formatArabicDateTime(invitation.eventStartsAt)}</dd>
          </div>
          <div className="notice-warning p-4">
            <dt className="text-sm">تنتهي صلاحية الدعوة</dt>
            <dd className="mt-1 font-extrabold">{formatArabicDateTime(invitation.expiresAt)}</dd>
          </div>
        </dl>
        <p className="my-6 text-sm muted-copy">لا يصبح المقعد مؤكدًا إلا بعد قبول الدعوة قبل انتهاء صلاحيتها.</p>
        <WaitlistInvitationAction action={acceptWaitlistInvitationAction.bind(null, token)} />
      </article>
    </main>
  );
}
