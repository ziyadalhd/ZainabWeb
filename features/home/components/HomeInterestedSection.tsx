import Link from "next/link";

export function HomeInterestedSection() {
  return (
    <section id="interest" className="relative isolate scroll-mt-24 overflow-hidden bg-[var(--brand-forest)] text-[var(--color-on-primary)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 end-0 w-1/2 border-s border-white/10 bg-[radial-gradient(circle_at_70%_30%,rgb(255_182_35_/_0.17),transparent_65%)]"
      />
      <div className="page-shell section-space relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-2xl">
          <p className="text-sm font-bold text-[var(--brand-amber)]">خليكِ قريبة</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-balance sm:text-5xl">لا يفوتكِ جديد بَيْن</h2>
          <p className="mt-4 max-w-xl text-base leading-8 text-white/85">
            سجّلي اهتمامكِ بالفعاليات القادمة. نستخدم بريدكِ لهذا الغرض فقط، ويمكنكِ إلغاء الاشتراك متى شئتِ.
          </p>
        </div>
        <Link
          href="/surveys/interested-contact"
          className="inline-flex min-h-12 w-full items-center justify-center gap-4 rounded-[var(--radius-control)] bg-[var(--brand-amber)] px-6 py-3 font-bold text-[var(--brand-forest)] transition-colors hover:bg-[var(--brand-cream)] sm:w-fit"
        >
          سجّلي اهتمامكِ <span aria-hidden="true">←</span>
        </Link>
      </div>
    </section>
  );
}
