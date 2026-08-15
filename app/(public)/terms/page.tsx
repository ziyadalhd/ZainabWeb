import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { publicContactEmail } from "@/lib/public-contact";

export const metadata: Metadata = {
  title: "الشروط والأحكام",
  description: "شروط وأحكام استخدام موقع نادي بَيْن الثقافي.",
};

export default function TermsPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="قبل الإطلاق" title="الشروط والأحكام" description="مسودة تشغيلية تعكس الخدمات الموجودة في الموقع فقط، وتحتاج اعتمادًا قانونيًا واستكمال العنوان والصفة النظامية قبل النشر العام." />
      <article className="card-surface mt-8 max-w-4xl p-6 sm:p-10">
        <p className="notice-warning text-sm"><strong>حالة هذه الصفحة:</strong> مسودة تأسيسية وليست استشارة قانونية. أضيفت وسيلة التواصل العامة، وما زال العنوان والصفة النظامية وطريقة الإفصاح عنها تحتاج مراجعة قبل الإطلاق.</p>

        <section className="mt-8">
          <h2 className="text-2xl font-black text-[var(--brand-green-deep)]">نطاق الموقع</h2>
          <p className="mt-3 leading-8 muted-copy">يقدم موقع نادي بَيْن الثقافي من مكة معلومات عن النادي والفعاليات، ونماذج لتسجيل الزائرات وطلبات حجز المساحة أو إقامة الحفلات أو تقديم الورش. يمكن التواصل عبر <a className="underline decoration-[var(--brand-amber)] underline-offset-4" dir="ltr" href={`mailto:${publicContactEmail}`}>{publicContactEmail}</a>. ما زال التحقق من ملاءمة النشاط والصفة النظامية وطريقة الإفصاح عنها قيد المراجعة قبل الإطلاق العام.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black text-[var(--brand-green-deep)]">التسجيل في الفعاليات</h2>
          <ul className="mt-3 list-disc space-y-2 pr-6 leading-8 muted-copy">
            <li>كل تسجيل يحجز مقعدًا واحدًا، ولا يتوفر حساب عام للزائرات.</li>
            <li>التسجيل يغلق تلقائيًا عند بدء الفعالية، ويجوز للإدارة إغلاقه مبكرًا.</li>
            <li>عند اكتمال المقاعد، يُسجل الطلب في قائمة انتظار بحسب وقت التسجيل، ولا يتم استبدال أي مقعد تلقائيًا.</li>
            <li>يمكن إدارة الحجز أو إلغاؤه من الرابط المرسل لصاحبة التسجيل.</li>
            <li>فعاليات النادي مخصصة للنساء؛ ويستلزم تسجيل القاصرات بيانات ولية الأمر وموافقتها الصريحة.</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black text-[var(--brand-green-deep)]">الأسعار والمدفوعات</h2>
          <p className="mt-3 leading-8 muted-copy">لا يعالج الموقع أي مدفوعات إلكترونية ولا يصدر تذاكر. عندما تكون الفعالية مدفوعة، يكون الدفع في موقع الفعالية فقط وفق السعر الظاهر عند التسجيل. طلبات الحجز ليست حجوزات مؤكدة؛ يحدد النادي العرض والسعر والشروط لكل طلب عند مراجعته.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black text-[var(--brand-green-deep)]">استخدام الموقع</h2>
          <p className="mt-3 leading-8 muted-copy">يجب إدخال بيانات صحيحة، وعدم استخدام الروابط الآمنة الخاصة بشخص آخر، وعدم محاولة تعطيل الموقع أو إرسال نماذج آلية. قد يُرفض أو يُلغى أي طلب لا يمكن التحقق من صحته أو يخالف هذه الشروط.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black text-[var(--brand-green-deep)]">التعديلات والتواصل</h2>
          <p className="mt-3 leading-8 muted-copy">تُستقبل الاستفسارات والشكاوى عبر <a className="underline decoration-[var(--brand-amber)] underline-offset-4" dir="ltr" href={`mailto:${publicContactEmail}`}>{publicContactEmail}</a>. يضاف قبل الإطلاق تاريخ النفاذ وسجل التعديلات والعنوان النهائي. لا تعتمد هذه المسودة حتى تُراجع مع طبيعة النشاط الفعلية والصفة النظامية.</p>
        </section>

        <Link href="/privacy" className="button-secondary mt-8">عرض سياسة الخصوصية</Link>
      </article>
    </main>
  );
}
