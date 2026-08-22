import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { publicContactEmail } from "@/lib/public-contact";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "سياسة الخصوصية لموقع نادي بَيْن الثقافي.",
};

const items = [
  ["بيانات التواصل", "الاسم، رقم الجوال السعودي، والبريد الإلكتروني عند إدخاله."],
  ["بيانات التسجيل والحجز", "بيانات المشاركة أو ولية الأمر عند التسجيل للقاصرات، وبيانات الحجز أو طلب الخدمة المرتبطة بها."],
  ["بيانات الاستبيان", "تقييمات الفعاليات والمقترحات، وخيار إظهار الاسم للمسؤولة عند استخدام رابط التقييم."],
];

export default function PrivacyPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="نادي بَيْن الثقافي" title="سياسة الخصوصية" description="سياسة الخصوصية وحماية البيانات الشخصية لزائرات ومستفيدات نادي بَيْن الثقافي." />
      <article className="card-surface mt-8 max-w-4xl p-6 sm:p-10">
        <section className="mt-2">
          <h2 className="text-2xl font-black text-[var(--brand-green-deep)]">من يعالج بياناتك</h2>
          <p className="mt-3 leading-8 muted-copy">يدير نادي بَيْن الثقافي هذا الموقع من مكة المكرمة. يمكن التواصل بشأن الخصوصية وحماية البيانات عبر <a className="underline decoration-[var(--brand-amber)] underline-offset-4" dir="ltr" href={`mailto:${publicContactEmail}`}>{publicContactEmail}</a>.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black text-[var(--brand-green-deep)]">ما البيانات التي نجمعها</h2>
          <dl className="mt-4 grid gap-4">
            {items.map(([term, description]) => <div key={term} className="border-r-4 border-[var(--brand-olive)] bg-[var(--color-surface-muted)] p-4"><dt className="font-extrabold">{term}</dt><dd className="mt-2 text-sm leading-7 muted-copy">{description}</dd></div>)}
          </dl>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black text-[var(--brand-green-deep)]">لماذا نستخدمها</h2>
          <ul className="mt-3 list-disc space-y-2 pr-6 leading-8 muted-copy">
            <li>إتمام التسجيل وإدارة المقاعد وقائمة الانتظار والتواصل بخصوص الفعالية.</li>
            <li>مراجعة طلبات حجز المساحة وتقديم الورش والتواصل بشأنها.</li>
            <li>إرسال معلومات فعاليات قادمة فقط لمن اختارت الموافقة الصريحة، مع إمكانية إلغاء الاشتراك.</li>
            <li>إدارة تقييم الفعالية وتحسين التجربة.</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black text-[var(--brand-green-deep)]">الاحتفاظ والمشاركة</h2>
          <p className="mt-3 leading-8 muted-copy">تُحذف بيانات التسجيل وطلبات الخدمات تلقائيًا بعد ٩٠ يومًا من انتهاء الغرض التشغيلي المحدد لها، مع الاحتفاظ بالإحصاءات المجهولة فقط عند الحاجة. بيانات المهتمات تُحتفظ بها إلى أن يتم إلغاء الاشتراك. لا نبيع البيانات الشخصية. لا تُتاح بيانات الزائرات للمسؤولات إلا بالقدر اللازم لإدارة الخدمة.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black text-[var(--brand-green-deep)]">حقوقك وطلباتها</h2>
          <p className="mt-3 leading-8 muted-copy">يمكنك طلب العلم ببياناتك، أو الوصول إليها، أو تصحيحها، أو إتلاف ما انتهت الحاجة إليه، أو الرجوع عن الموافقة عندما تكون هي أساس المعالجة. تُستقبل الطلبات عبر <a className="underline decoration-[var(--brand-amber)] underline-offset-4" dir="ltr" href={`mailto:${publicContactEmail}`}>{publicContactEmail}</a>، وقد نطلب الحد الأدنى اللازم للتحقق من هوية صاحبة الطلب وحماية بياناتها.</p>
        </section>

        <section className="mt-8 border-t border-[var(--color-border)] pt-6 text-sm muted-copy">
          <h2 className="font-extrabold text-[var(--brand-green-deep)]">المراجع والأنظمة المعتمدة</h2>
          <ul className="mt-3 list-disc space-y-2 pr-6">
            <li><a className="underline decoration-[var(--brand-amber)] underline-offset-4" href="https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/ElaborationandDevelopingPrivacyPolicyGuideline" target="_blank" rel="noreferrer">الدليل الاسترشادي لإعداد وتطوير سياسة الخصوصية — سدايا</a></li>
            <li><a className="underline decoration-[var(--brand-amber)] underline-offset-4" href="https://sdaia.gov.sa/ar/Research/Pages/DataProtection.aspx" target="_blank" rel="noreferrer">حقوق أصحاب البيانات الشخصية — سدايا</a></li>
          </ul>
        </section>

        <Link href="/terms" className="button-secondary mt-8">عرض الشروط والأحكام</Link>
      </article>
    </main>
  );
}
