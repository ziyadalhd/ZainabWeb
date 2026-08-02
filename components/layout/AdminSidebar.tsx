import Link from "next/link";
import { ClubLogo } from "@/components/brand/ClubLogo";
import { adminNavigation } from "@/lib/navigation";

export function AdminSidebar() {
  return (
    <aside className="hidden min-h-screen bg-[var(--brand-green)] px-4 py-6 text-[var(--brand-ivory)] lg:block">
      <Link href="/admin" aria-label="لوحة إدارة نادي بَيْن الثقافي" className="flex items-center gap-3 border-b border-white/15 pb-5">
        <ClubLogo variant="on-green" className="h-auto w-20" priority />
        <span className="font-extrabold">لوحة الإدارة</span>
      </Link>
      <nav aria-label="أقسام لوحة الإدارة" className="mt-6">
        <ul className="grid gap-1">
          {adminNavigation.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block rounded-2xl px-4 py-2.5 text-sm font-bold text-white/85 hover:bg-white/10 hover:text-white">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
