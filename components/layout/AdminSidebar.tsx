import Link from "next/link";
import { ClubLogo } from "@/components/brand/ClubLogo";
import { adminNavigation } from "@/lib/navigation";
import { logoutAction } from "@/app/(dashboard)/admin/actions";

export function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen overflow-y-auto overscroll-contain bg-[var(--brand-forest)] px-5 py-6 text-[var(--color-on-primary)] lg:block">
      <Link href="/admin" aria-label="لوحة إدارة نادي بَيْن الثقافي" className="flex items-center gap-3 border-b border-white/18 pb-6">
        <ClubLogo variant="on-green" className="h-auto w-24" priority />
        <span className="font-extrabold">الإدارة</span>
      </Link>
      <nav aria-label="أقسام لوحة الإدارة" className="mt-6">
        <ul className="grid gap-0.5">
          {adminNavigation.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block border-r-4 border-transparent px-4 py-2.5 text-sm font-bold text-white/82 transition-[border-color,background-color,color] hover:border-[var(--brand-amber)] hover:bg-white/8 hover:text-white">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <form action={logoutAction} className="mt-8 border-t border-white/15 pt-5">
        <button type="submit" className="w-full rounded-[var(--radius-control)] border border-white/35 px-4 py-2.5 text-sm font-bold hover:bg-white/10">تسجيل الخروج</button>
      </form>
    </aside>
  );
}
