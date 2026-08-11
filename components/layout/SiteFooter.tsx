import Link from "next/link";
import { ClubLogo } from "@/components/brand/ClubLogo";
import { getPublicSiteSettings } from "@/lib/supabase/site-settings";

export async function SiteFooter() {
  const settings = await getPublicSiteSettings();
  return (
    <footer className="mt-20 bg-[var(--brand-green)] text-[var(--brand-ivory)]">
      <div className="page-shell grid gap-8 py-10 sm:grid-cols-[auto_1fr] sm:items-center">
        <Link href="/" aria-label="نادي بَيْن الثقافي — الرئيسية" className="w-fit">
          <ClubLogo variant="on-green" alt="" className="h-auto w-28" />
        </Link>
        <div>
          <p className="text-xl font-extrabold">نادي بَيْن الثقافي</p>
          <p className="mt-2 text-sm text-white/80">مكة · {settings.contactPhone ?? "0537918640"}</p>
          {settings.instagramUrl || settings.tiktokUrl ? <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold"><a href={settings.instagramUrl ?? undefined} className={settings.instagramUrl ? "underline" : "hidden"} target="_blank" rel="noreferrer">Instagram</a><a href={settings.tiktokUrl ?? undefined} className={settings.tiktokUrl ? "underline" : "hidden"} target="_blank" rel="noreferrer">TikTok</a></div> : null}
        </div>
      </div>
    </footer>
  );
}
