import { ClubLogo } from "@/components/brand/ClubLogo";
import { AdminMobileNavigation } from "@/components/navigation/AdminMobileNavigation";
import { logoutAction } from "@/app/(dashboard)/admin/actions";

export function AdminHeader() {
  return (
    <header className="relative flex min-h-20 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--brand-cream)] px-3 py-3 lg:hidden">
      <div className="flex items-center gap-3">
        <ClubLogo className="h-auto w-20" priority />
        <span className="hidden font-extrabold text-[var(--brand-forest)] sm:inline">لوحة الإدارة</span>
      </div>
      <div className="flex items-center gap-2">
        <form action={logoutAction}><button type="submit" className="button-quiet text-xs">خروج</button></form>
        <AdminMobileNavigation />
      </div>
    </header>
  );
}
