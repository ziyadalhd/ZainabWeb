import Link from "next/link";
import { ClubLogo } from "@/components/brand/ClubLogo";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-[var(--brand-green)] text-[var(--brand-ivory)]">
      <div className="page-shell grid gap-8 py-10 sm:grid-cols-[auto_1fr] sm:items-center">
        <Link href="/" aria-label="نادي بَيْن الثقافي — الرئيسية" className="w-fit">
          <ClubLogo variant="on-green" alt="" className="h-auto w-28" />
        </Link>
        <div>
          <p className="text-xl font-extrabold">نادي بَيْن الثقافي</p>
          <p className="mt-2 text-sm text-white/80">مكة · 0537918640</p>
          <p className="mt-5 text-xs text-white/65">الروابط الاجتماعية ستُضاف بعد اعتمادها.</p>
        </div>
      </div>
    </footer>
  );
}
