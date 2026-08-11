import Link from "next/link";
import { ClubLogo } from "@/components/brand/ClubLogo";
import { DesktopNavigation } from "@/components/navigation/DesktopNavigation";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";
import { publicNavigation } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-t-4 border-b-[var(--color-border)] border-t-[var(--brand-amber)] bg-[var(--brand-cream)]/96 backdrop-blur-sm">
      <div className="page-shell relative flex min-h-20 items-center justify-between gap-5 py-2 sm:min-h-24">
        <Link href="/" aria-label="العودة إلى الرئيسية" className="flex min-w-0 items-center gap-3">
          <ClubLogo priority className="h-auto w-24 sm:w-32" />
          <span className="sr-only">نادي بَيْن الثقافي</span>
        </Link>
        <DesktopNavigation items={publicNavigation} />
        <MobileNavigation items={publicNavigation} />
      </div>
    </header>
  );
}
