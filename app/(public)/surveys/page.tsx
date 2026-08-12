import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "استبيانات" };

const surveys = [
  { href: "/surveys/workshop-application", title: "طلب تقديم ورشة", status: "الحقول قيد الاعتماد" },
  { href: "/surveys/interested-contact", title: "تسجيل المهتمين", status: "الاسم والجوال السعودي والبريد الإلكتروني" },
  { href: "/surveys/event-feedback", title: "تقييم الفعالية", status: "يصل برابط آمن من النادي" },
];

export default function SurveysPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="شاركنا رأيك" title="استبيانات" description="واجهات أولية للاستبيانات المعتمدة ضمن نطاق النادي." />
      <div className="mt-10 border-t border-[var(--brand-olive)]">
        {surveys.map((survey) => (
          <Link key={survey.href} href={survey.href} className="group grid min-h-28 gap-2 border-b border-[var(--color-border)] py-5 transition-[background-color,padding] hover:bg-[var(--brand-cream)] hover:px-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div><h2 className="text-xl font-black text-[var(--brand-forest)]">{survey.title}</h2><p className="mt-2 text-sm muted-copy">{survey.status}</p></div>
            <span aria-hidden="true" className="text-2xl text-[var(--brand-forest)] transition-transform group-hover:-translate-x-1">←</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
