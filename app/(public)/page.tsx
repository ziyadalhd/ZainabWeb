import Link from "next/link";
import { BrandIntersection } from "@/components/brand/BrandIntersection";
import { ClubStoryTabs } from "@/features/home/components/ClubStoryTabs";
import { HomeUpcomingEvents, selectHomeEvents } from "@/features/home/components/HomeUpcomingEvents";
import { createEventCatalog } from "@/lib/supabase/events";
import { getPublicSiteSettings } from "@/lib/supabase/site-settings";

const destinations = [
  { href: "/space-booking", label: "حجز المساحة" },
  { href: "/celebration-booking", label: "حجز إقامة حفلات" },
  { href: "/bayn-trips", label: "رحلات بَيْن" },
  { href: "/literary-partner", label: "الشريك الأدبي" },
  { href: "/events", label: "الفعاليات" },
  { href: "/surveys", label: "استبيانات" },
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
            <Link href="/events" className="button-primary px-6 py-3">استعراض الفعاليات</Link>
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

      <section className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="page-shell section-space">
        <p className="eyebrow">الأقسام</p>
        <h2 className="mt-4 text-3xl font-black text-[var(--brand-forest)] sm:text-4xl">ابدأ من هنا</h2>
        <div className="mt-8 border-t border-[var(--brand-olive)]">
          {destinations.map((destination) => (
            <Link key={destination.href} href={destination.href} className="group grid min-h-20 grid-cols-[1rem_1fr_auto] items-center gap-4 border-b border-[var(--color-border)] py-3 text-[var(--brand-forest)] transition-[background-color,padding] hover:bg-[var(--brand-cream)] hover:px-3">
              <span aria-hidden="true" className="size-3 bg-[var(--brand-amber)]" />
              <span className="text-xl font-black sm:text-2xl">{destination.label}</span>
              <span aria-hidden="true" className="text-2xl transition-transform group-hover:-translate-x-1">←</span>
            </Link>
          ))}
        </div>
        </div>
      </section>
    </main>
  );
}
