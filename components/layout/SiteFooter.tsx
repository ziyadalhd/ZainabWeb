import Link from "next/link";
import { ClubLogo } from "@/components/brand/ClubLogo";
import { getPublicSiteSettings } from "@/lib/supabase/site-settings";

export async function SiteFooter() {
  const settings = await getPublicSiteSettings().catch(() => null);
  return (
    <footer className="mt-12 border-t-4 border-[var(--brand-amber)] bg-[var(--brand-forest)] text-[var(--color-on-primary)] sm:mt-16">
      <div className="page-shell grid grid-cols-[5.5rem_1fr] items-center gap-5 py-8 sm:grid-cols-[auto_1fr] sm:gap-8 sm:py-10">
        <Link href="/" aria-label="نادي بَيْن الثقافي — الرئيسية" className="w-fit">
          <ClubLogo variant="on-green" alt="" className="h-auto w-20 sm:w-28" />
        </Link>
        <div>
          <p className="text-lg font-black sm:text-2xl">نادي بَيْن الثقافي</p>
          <p className="mt-1 text-xs text-white/78 sm:mt-2 sm:text-sm">مكة · <span dir="ltr" className="inline-block">{settings?.contactPhone ?? "0537918640"}</span></p>
          {settings?.instagramUrl || settings?.tiktokUrl ? <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold"><a href={settings.instagramUrl ?? undefined} className={settings.instagramUrl ? "border-b border-white/60 hover:border-[var(--brand-amber)]" : "hidden"} target="_blank" rel="noreferrer">Instagram</a><a href={settings.tiktokUrl ?? undefined} className={settings.tiktokUrl ? "border-b border-white/60 hover:border-[var(--brand-amber)]" : "hidden"} target="_blank" rel="noreferrer">TikTok</a></div> : null}
        </div>
      </div>
    </footer>
  );
}
