import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistInvitationAction } from "@/features/bookings/components/WaitlistInvitationAction";
import { formatArabicDateTime } from "@/lib/format/date";
import { createRegistrationService } from "@/lib/supabase/registrations";
import { acceptWaitlistInvitationAction } from "@/app/(public)/waitlist-invitations/[token]/actions";

export const metadata: Metadata = { title: "دعوة قائمة الانتظار" };
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
          <Link className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--brand-green)] px-4 py-2 font-bold text-white" href="/events">عرض الفعاليات</Link>
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
          <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
            <dt className="text-sm muted-copy">موعد الفعالية</dt>
            <dd className="mt-1 font-extrabold">{formatArabicDateTime(invitation.eventStartsAt)}</dd>
          </div>
          <div className="rounded-2xl bg-[var(--color-warning-bg)] p-4 text-[var(--color-warning-text)]">
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
