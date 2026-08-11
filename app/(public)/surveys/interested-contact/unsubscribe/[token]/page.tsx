import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { unsubscribeInterestedContactAction } from "@/app/(public)/surveys/interested-contact/actions";
import { isSecureToken } from "@/lib/security/secure-token";

export const metadata: Metadata = { title: "إلغاء الاشتراك" };

export default async function InterestedContactUnsubscribePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ success?: string; error?: string }> }) {
  const [{ token }, { success, error }] = await Promise.all([params, searchParams]);
  const validToken = isSecureToken(token);

  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="إدارة الموافقة" title="إلغاء الاشتراك من الفعاليات القادمة" />
      <section className="card-surface mt-8 max-w-3xl p-6 sm:p-8">
        {success ? <p role="status" className="rounded-2xl bg-[var(--color-success-bg)] px-4 py-3 font-bold text-[var(--color-success-text)]">تم إلغاء اشتراكك. لن نستخدم بياناتك لإرسال معلومات الفعاليات القادمة.</p> : null}
        {error || !validToken ? <p role="alert" className="rounded-2xl bg-[var(--color-error-bg)] px-4 py-3 font-bold text-[var(--color-error-text)]">رابط إلغاء الاشتراك غير صالح أو لم يعد متاحًا.</p> : null}
        {!success && validToken ? <><p className="leading-8 muted-copy">هل تريدين إلغاء موافقتك على استلام معلومات الفعاليات القادمة؟ لن تظهر أي بيانات شخصية في هذه الصفحة.</p><form action={unsubscribeInterestedContactAction.bind(null, token)} className="mt-6"><button type="submit" className="min-h-12 rounded-2xl border border-[var(--color-error-text)] px-5 py-3 font-extrabold text-[var(--color-error-text)]">تأكيد إلغاء الاشتراك</button></form></> : null}
      </section>
    </main>
  );
}
