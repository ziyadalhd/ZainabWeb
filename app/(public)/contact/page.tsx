import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { publicContactEmail } from "@/lib/public-contact";
import { toSaudiWhatsAppUrl } from "@/lib/contact-links";
import { getPublicSiteSettings } from "@/lib/supabase/site-settings";

export const metadata: Metadata = {
  title: "التواصل",
  description: "وسائل التواصل ومقر نادي بَيْن الثقافي في مكة.",
};

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();
  const phone = settings.contactPhone ?? "0537918640";
  const whatsappUrl = toSaudiWhatsAppUrl(phone);
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="ابقَ على تواصل" title="التواصل" />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <a className="card-surface p-6 transition-colors hover:border-[var(--brand-olive)]" href={whatsappUrl ?? `tel:${phone}`} target={whatsappUrl ? "_blank" : undefined} rel={whatsappUrl ? "noreferrer" : undefined}>
          <p className="text-sm font-bold muted-copy">رقم التواصل</p>
          <p className="mt-3 text-2xl font-extrabold text-[var(--brand-green-deep)]" dir="ltr">{phone}</p>
          <p className="mt-2 text-sm muted-copy">تواصلي معنا على WhatsApp</p>
        </a>
        <a className="card-surface p-6" href={`mailto:${publicContactEmail}`}>
          <p className="text-sm font-bold muted-copy">البريد الإلكتروني</p>
          <p className="mt-3 break-all text-lg font-extrabold text-[var(--brand-green-deep)]" dir="ltr">{publicContactEmail}</p>
        </a>
        {settings.defaultVenueName || settings.defaultVenueAddress ? (
          settings.defaultVenueMapUrl ? <a className="card-surface p-6 transition-colors hover:border-[var(--brand-olive)]" href={settings.defaultVenueMapUrl} target="_blank" rel="noreferrer"><p className="text-sm font-bold muted-copy">المقر</p>{settings.defaultVenueName ? <p className="mt-3 text-lg font-extrabold text-[var(--brand-green-deep)]">{settings.defaultVenueName}</p> : null}{settings.defaultVenueAddress ? <p className="mt-2 muted-copy">{settings.defaultVenueAddress}</p> : null}<p className="mt-3 text-sm font-bold text-[var(--brand-forest)]">افتحي الموقع في الخرائط ←</p></a> : <section className="card-surface p-6"><p className="text-sm font-bold muted-copy">المقر</p>{settings.defaultVenueName ? <p className="mt-3 text-lg font-extrabold text-[var(--brand-green-deep)]">{settings.defaultVenueName}</p> : null}{settings.defaultVenueAddress ? <p className="mt-2 muted-copy">{settings.defaultVenueAddress}</p> : null}</section>
        ) : null}
        {settings.tiktokUrl ? <a className="card-surface p-6 transition-colors hover:border-[var(--brand-olive)]" aria-label="TikTok" href={settings.tiktokUrl} target="_blank" rel="noreferrer"><p className="text-lg font-extrabold text-[var(--brand-green-deep)]">TikTok</p></a> : null}
        {settings.instagramUrl ? <a className="card-surface p-6 transition-colors hover:border-[var(--brand-olive)]" aria-label="Instagram" href={settings.instagramUrl} target="_blank" rel="noreferrer"><p className="text-lg font-extrabold text-[var(--brand-green-deep)]">Instagram</p></a> : null}
      </div>
    </main>
  );
}
