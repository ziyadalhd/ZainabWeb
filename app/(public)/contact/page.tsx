import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { publicContactEmail } from "@/lib/public-contact";
import { getPublicSiteSettings } from "@/lib/supabase/site-settings";

export const metadata: Metadata = {
  title: "التواصل",
  description: "وسائل التواصل ومقر نادي بَيْن الثقافي في مكة.",
};

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="ابقَ على تواصل" title="التواصل" />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <section className="card-surface p-6">
          <p className="text-sm font-bold muted-copy">رقم التواصل</p>
          <p className="mt-3 text-2xl font-extrabold text-[var(--brand-green-deep)]" dir="ltr">{settings.contactPhone ?? "0537918640"}</p>
        </section>
        <a className="card-surface p-6" href={`mailto:${publicContactEmail}`}>
          <p className="text-sm font-bold muted-copy">البريد الإلكتروني</p>
          <p className="mt-3 break-all text-lg font-extrabold text-[var(--brand-green-deep)]" dir="ltr">{publicContactEmail}</p>
        </a>
        {settings.defaultVenueName || settings.defaultVenueAddress ? <section className="card-surface p-6"><p className="text-sm font-bold muted-copy">المقر</p>{settings.defaultVenueName ? <p className="mt-3 text-lg font-extrabold text-[var(--brand-green-deep)]">{settings.defaultVenueName}</p> : null}{settings.defaultVenueAddress ? <p className="mt-2 muted-copy">{settings.defaultVenueAddress}</p> : null}</section> : null}
        {settings.tiktokUrl ? <a className="card-surface p-6" aria-label="TikTok" href={settings.tiktokUrl} target="_blank" rel="noreferrer"><p className="text-lg font-extrabold text-[var(--brand-green-deep)]">TikTok</p><p className="mt-3 muted-copy">فتح الحساب الرسمي</p></a> : null}
        {settings.instagramUrl ? <a className="card-surface p-6" aria-label="Instagram" href={settings.instagramUrl} target="_blank" rel="noreferrer"><p className="text-lg font-extrabold text-[var(--brand-green-deep)]">Instagram</p><p className="mt-3 muted-copy">فتح الحساب الرسمي</p></a> : null}
      </div>
    </main>
  );
}
