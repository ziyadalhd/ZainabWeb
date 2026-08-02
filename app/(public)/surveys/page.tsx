import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "استبيانات" };

const surveys = [
  { href: "/surveys/workshop-application", title: "طلب تقديم ورشة", status: "الحقول قيد الاعتماد" },
  { href: "/surveys/interested-contact", title: "تسجيل المهتمين", status: "الحقول قيد الاعتماد" },
  { href: "/surveys/event-feedback", title: "تقييم الفعالية", status: "واجهة تجريبية متاحة" },
];

export default function SurveysPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="شاركنا رأيك" title="استبيانات" description="واجهات أولية للاستبيانات المعتمدة ضمن نطاق النادي." />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {surveys.map((survey) => (
          <Link key={survey.href} href={survey.href} className="card-surface p-6 transition-transform hover:-translate-y-1">
            <h2 className="text-xl font-extrabold text-[var(--brand-green-deep)]">{survey.title}</h2>
            <p className="mt-4 text-sm muted-copy">{survey.status}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
