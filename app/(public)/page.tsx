import Link from "next/link";
import { BrandIntersection } from "@/components/brand/BrandIntersection";
import { HomeClubStory } from "@/features/home/components/HomeClubStory";
import { HomeUpcomingEvents, selectHomeEvents } from "@/features/home/components/HomeUpcomingEvents";
import { HomeInterestedSection } from "@/features/home/components/HomeInterestedSection";
import { HomePastEvents, selectHomePastEvents } from "@/features/home/components/HomePastEvents";
import { createEventCatalog } from "@/lib/supabase/events";
import { getPublicSiteSettings } from "@/lib/supabase/site-settings";

const destinations = [
  { href: "/space-booking", label: "حجز المساحة", description: "مساحة هادئة ومجهزة للقاءاتكِ الثقافية وفعالياتكِ الخاصة." },
  { href: "/bayn-trips", label: "رحلات بَيْن", description: "تجارب ورحلات ثقافية نوعية تثري معرفتكِ وتجمعكِ بالمهتمات." },
  { href: "/surveys/workshop-application", label: "طلب تقديم ورشة", description: "شاركي خبرتكِ، وقدّمي مقترحًا لورشة ثقافية أو مهارية." },
  { href: "/literary-partner", label: "الشريك الأدبي", description: "مبادرة لتعزيز الحراك الأدبي وإثراء المشهد الثقافي في مكة." },
  { href: "/contact", label: "التواصل والمقر", description: "طرق التواصل وموقع النادي في مكة المكرمة." },
];

export default async function HomePage() {
  const catalog = await createEventCatalog();
  const [settings, events, pastEvents] = await Promise.all([
    getPublicSiteSettings(),
    catalog.listUpcomingEvents().then(selectHomeEvents),
    catalog.listPastEvents().then(selectHomePastEvents),
  ]);
  const story = [
    { title: "عن النادي", body: settings.clubIntroduction ?? "نتعرّف أكثر على النادي قريبًا." },
    { title: "فكرة اسم بَيْن", body: settings.nameStory ?? "سنشارك قصة اسم بَيْن قريبًا." },
    { title: "أهداف النادي", body: settings.objectives ?? "سنشارك أهداف النادي قريبًا." },
  ];

  return (
    <main>
      <section className="home-hero">
        <div className="page-shell home-hero__inner">
          <div className="home-hero__copy">
            <p className="eyebrow">مساحة ثقافية في مكة</p>
            <h1 className="home-hero__title">
              نادي <span>بَيْن</span> الثقافي
            </h1>
            <p className="home-hero__description">اكتشفي فعاليات النادي، واطّلعي على لقاءاته السابقة وخدماته.</p>
            <div className="home-hero__actions">
              <Link href="#upcoming" className="button-primary">
                الفعاليات القادمة <span aria-hidden="true">↓</span>
              </Link>
              <Link href="#story" className="home-text-link">
                تعرّفي على النادي <span aria-hidden="true">←</span>
              </Link>
            </div>
          </div>
          <div className="home-hero__art">
            <div className="home-hero__mark">
              <BrandIntersection />
            </div>
            <span className="home-hero__place">مكة المكرمة</span>
          </div>
        </div>
      </section>

      <HomeUpcomingEvents events={events} />
      <HomePastEvents events={pastEvents} />
      <HomeClubStory sections={story} />

      <section className="home-destinations">
        <div className="page-shell section-space">
          <div className="home-section-heading">
            <div>
              <p className="eyebrow">أقسام النادي</p>
              <h2>استكشفي بَيْن</h2>
            </div>
          </div>
          <div className="home-destinations__grid">
            {destinations.map((destination) => (
              <Link key={destination.href} href={destination.href} className="home-destinations__link">
                <span>
                  <strong>{destination.label}</strong>
                  <small>{destination.description}</small>
                </span>
                <span aria-hidden="true">←</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HomeInterestedSection />
    </main>
  );
}
