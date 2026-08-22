import Link from "next/link";
import { BrandIntersection } from "@/components/brand/BrandIntersection";
import { ClubStoryTabs } from "@/features/home/components/ClubStoryTabs";
import { HomeUpcomingEvents, selectHomeEvents } from "@/features/home/components/HomeUpcomingEvents";
import { HomeInterestedSection } from "@/features/home/components/HomeInterestedSection";
import { createEventCatalog } from "@/lib/supabase/events";
import { getPublicSiteSettings } from "@/lib/supabase/site-settings";

const destinations = [
  { href: "/events", label: "الفعاليات", description: "استكشفي اللقاءات الأدبية والورش الثقافية القادمة واحجزي مقعدكِ." },
  { href: "/space-booking", label: "حجز المساحة", description: "مساحة هادئة ومجهزة للقاءاتكِ الثقافية وفعالياتكِ الخاصة." },
  { href: "/bayn-trips", label: "رحلات بَيْن", description: "تجارب ورحلات ثقافية نوعية تثري معرفتكِ وتجمعكِ بالمهتمات." },
  { href: "/surveys/workshop-application", label: "طلب تقديم ورشة", description: "شاركينا خبرتكِ وشغفكِ وقدمي مقترح ورشة عمل ثقافية أو مهارية." },
  { href: "/literary-partner", label: "الشريك الأدبي", description: "مبادرة لتعزيز الحراك الأدبي وإثراء المشهد الثقافي في مكة." },
  { href: "/contact", label: "التواصل والمقر", description: "طرق التواصل وموقع النادي في مكة المكرمة." },
];

export default async function HomePage() {
  const [settings, events] = await Promise.all([
    getPublicSiteSettings().catch(() => null),
    createEventCatalog()
      .then((catalog) => catalog.listUpcomingEvents())
      .then(selectHomeEvents)
      .catch(() => []),
  ]);
  const sections = [
    { title: "عن النادي", body: settings?.clubIntroduction ?? "نتعرّف أكثر على النادي قريبًا." },
    { title: "فكرة اسم بَيْن", body: settings?.nameStory ?? "حكاية اسم بَيْن بنشاركها هنا قريبًا." },
    { title: "أهداف النادي", body: settings?.objectives ?? "أهداف النادي بنشاركها هنا قريبًا." },
  ];
  return (
    <main>
      <section className="page-shell grid items-center gap-9 py-10 sm:py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,0.72fr)] lg:py-20">
        <div className="max-w-3xl">
          <p className="eyebrow">مساحة ثقافية في مكة</p>
          <h1 className="page-title mt-5">نادي بَيْن الثقافي</h1>
          <div className="mt-7 flex flex-col gap-3 min-[380px]:flex-row min-[380px]:flex-wrap">
            <Link href="/events" className="button-primary px-6 py-3">استكشفي الفعاليات</Link>
            <Link href="/contact" className="button-secondary px-6 py-3">التواصل</Link>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[20rem] sm:max-w-[25rem] lg:ml-0 lg:max-w-[31rem]">
          <BrandIntersection />
        </div>
      </section>

      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="page-shell section-space">
          <ClubStoryTabs sections={sections} />
        </div>
      </section>

      <HomeUpcomingEvents events={events} />

      <HomeInterestedSection />

      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="page-shell section-space">
          <p className="eyebrow">أقسام النادي</p>
          <h2 className="mt-4 text-3xl font-black text-[var(--brand-forest)] sm:text-4xl">ابدئي هنا</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((destination) => (
              <Link
                key={destination.href}
                href={destination.href}
                className="group card-surface flex flex-col justify-between p-6 transition-[border-color,transform] hover:border-[var(--brand-olive)] hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-black text-[var(--brand-forest)] group-hover:text-[var(--brand-green-deep)]">
                      {destination.label}
                    </h3>
                    <span aria-hidden="true" className="text-xl text-[var(--brand-amber)] transition-transform group-hover:-translate-x-1">
                      ←
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 muted-copy">{destination.description}</p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[var(--brand-forest)]">
                  <span>استكشفي القسم ←</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
