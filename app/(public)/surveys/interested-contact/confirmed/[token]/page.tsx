import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { isSecureToken } from "@/lib/security/secure-token";

export const metadata: Metadata = { title: "تم تسجيل الاهتمام" };

export default async function InterestedContactConfirmedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const unsubscribePath = isSecureToken(token) ? `/surveys/interested-contact/unsubscribe/${token}` : "/surveys/interested-contact";

  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="تم التسجيل" title="شكرًا لتسجيل اهتمامك" description="حُفظت موافقتك لإرسال معلومات الفعاليات القادمة." />
      <section className="card-surface mt-8 max-w-3xl p-6 sm:p-8">
        <p className="leading-8 muted-copy">احتفظي بهذا الرابط إذا رغبتِ في إلغاء الاشتراك لاحقًا. عند تفعيل الرسائل، سيظهر الرابط نفسه في كل رسالة تصل إلى بريدك.</p>
        <Link href={unsubscribePath} className="mt-6 inline-flex rounded-2xl border border-[var(--brand-green)] px-5 py-3 font-extrabold text-[var(--brand-green-deep)]">رابط إلغاء الاشتراك الآمن</Link>
      </section>
    </main>
  );
}
