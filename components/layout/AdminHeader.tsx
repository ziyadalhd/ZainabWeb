import { ClubLogo } from "@/components/brand/ClubLogo";
import { AdminMobileNavigation } from "@/components/navigation/AdminMobileNavigation";
import { logoutAction } from "@/app/(dashboard)/admin/actions";

export function AdminHeader() {
  return (
    <header className="relative flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--brand-ivory)] px-4 py-3 lg:hidden">
      <div className="flex items-center gap-3">
        <ClubLogo className="h-auto w-16" priority />
        <span className="font-extrabold text-[var(--brand-green-deep)]">لوحة الإدارة</span>
      </div>
      <div className="flex items-center gap-2">
        <form action={logoutAction}><button type="submit" className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-bold">خروج</button></form>
        <AdminMobileNavigation />
      </div>
    </header>
  );
}
