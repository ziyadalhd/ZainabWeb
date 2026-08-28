import { ClubLogo } from "@/components/brand/ClubLogo";
import { AdminMobileNavigation } from "@/components/navigation/AdminMobileNavigation";
import { AdminSearchForm } from "@/components/navigation/AdminSearchForm";
import { logoutAction } from "@/app/(dashboard)/admin/actions";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--brand-cream)] px-3 py-2 lg:hidden">
      <div className="flex min-h-12 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClubLogo className="h-auto w-20" priority />
          <span className="hidden font-bold text-[var(--brand-forest)] sm:inline">لوحة الإدارة</span>
        </div>
        <div className="flex items-center gap-2">
          <form action={logoutAction}>
            <button type="submit" className="button-quiet text-xs">
              خروج
            </button>
          </form>
          <AdminMobileNavigation />
        </div>
      </div>
      <AdminSearchForm
        className="pb-2"
        id="admin-mobile-search"
        inputClassName="min-h-10 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
      />
    </header>
  );
}
