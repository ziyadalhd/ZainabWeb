import Link from "next/link";
import { ClubLogo } from "@/components/brand/ClubLogo";
import { DesktopNavigation } from "@/components/navigation/DesktopNavigation";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";
import { publicNavigation } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--brand-ivory)]/95 backdrop-blur">
      <div className="page-shell relative flex min-h-24 items-center justify-between gap-5 py-2">
        <Link href="/" aria-label="العودة إلى الرئيسية" className="flex items-center gap-3">
          <ClubLogo priority />
          <span className="hidden text-lg font-extrabold text-[var(--brand-green-deep)] sm:block">نادي بَيْن الثقافي</span>
        </Link>
        <DesktopNavigation items={publicNavigation} />
        <MobileNavigation items={publicNavigation} />
      </div>
    </header>
  );
}
