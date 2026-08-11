import Link from "next/link";
import { ClubLogo } from "@/components/brand/ClubLogo";
import { getPublicSiteSettings } from "@/lib/supabase/site-settings";

export async function SiteFooter() {
  const settings = await getPublicSiteSettings();
  return (
    <footer className="mt-20 border-t-8 border-[var(--brand-amber)] bg-[var(--brand-forest)] text-[var(--color-on-primary)]">
      <div className="page-shell grid gap-8 py-12 sm:grid-cols-[auto_1fr] sm:items-center">
        <Link href="/" aria-label="نادي بَيْن الثقافي — الرئيسية" className="w-fit">
          <ClubLogo variant="on-green" alt="" className="h-auto w-32" />
        </Link>
        <div>
          <p className="text-2xl font-black">نادي بَيْن الثقافي</p>
          <p className="mt-2 text-sm text-white/78">مكة · <span dir="ltr" className="inline-block">{settings.contactPhone ?? "0537918640"}</span></p>
          {settings.instagramUrl || settings.tiktokUrl ? <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold"><a href={settings.instagramUrl ?? undefined} className={settings.instagramUrl ? "border-b border-white/60 hover:border-[var(--brand-amber)]" : "hidden"} target="_blank" rel="noreferrer">Instagram</a><a href={settings.tiktokUrl ?? undefined} className={settings.tiktokUrl ? "border-b border-white/60 hover:border-[var(--brand-amber)]" : "hidden"} target="_blank" rel="noreferrer">TikTok</a></div> : null}
        </div>
      </div>
    </footer>
  );
}
