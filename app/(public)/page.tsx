import Link from "next/link";
import { ClubLogo } from "@/components/brand/ClubLogo";

const sections = [
  { title: "عن النادي", body: "محتوى هذه الصفحة قيد الإعداد." },
  { title: "فكرة اسم بَيْن", body: "محتوى هذه الصفحة قيد الإعداد." },
  { title: "أهداف النادي", body: "محتوى هذه الصفحة قيد الإعداد." },
];

const destinations = [
  { href: "/space-booking", label: "حجز المساحة" },
  { href: "/celebration-booking", label: "حجز إقامة حفلات" },
  { href: "/bayn-trips", label: "رحلات بَيْن" },
  { href: "/literary-partner", label: "الشريك الأدبي" },
  { href: "/events", label: "الفعاليات" },
  { href: "/surveys", label: "استبيانات" },
];

export default function HomePage() {
  return (
    <main>
      <section className="page-shell grid min-h-[72vh] items-center gap-10 py-12 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="eyebrow">مساحة ثقافية في مكة</p>
          <h1 className="page-title mt-4">نادي بَيْن الثقافي</h1>
          <p className="mt-6 max-w-2xl text-lg muted-copy">واجهة عربية للتعرّف على النادي وأقسامه وفعالياته.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/events" className="rounded-full bg-[var(--brand-green)] px-6 py-3 font-bold text-[var(--brand-ivory)]">استعراض الفعاليات</Link>
            <Link href="/contact" className="rounded-full border border-[var(--brand-green)] px-6 py-3 font-bold text-[var(--brand-green)]">التواصل</Link>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <ClubLogo className="h-auto w-full max-w-md" priority />
        </div>
      </section>

      <section className="bg-white/60">
        <div className="page-shell section-space grid gap-5 md:grid-cols-3">
          {sections.map((section) => (
            <article key={section.title} className="card-surface p-6">
              <h2 className="text-xl font-extrabold text-[var(--brand-green-deep)]">{section.title}</h2>
              <p className="mt-3 muted-copy">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell section-space">
        <p className="eyebrow">الأقسام</p>
        <h2 className="mt-3 text-3xl font-extrabold text-[var(--brand-green-deep)]">ابدأ من هنا</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination) => (
            <Link key={destination.href} href={destination.href} className="card-surface flex min-h-32 items-end justify-between p-5 font-extrabold text-[var(--brand-green-deep)] transition-transform hover:-translate-y-1">
              <span>{destination.label}</span><span aria-hidden="true">←</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
