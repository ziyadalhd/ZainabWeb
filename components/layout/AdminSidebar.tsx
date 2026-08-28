"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClubLogo } from "@/components/brand/ClubLogo";
import { AdminSearchForm } from "@/components/navigation/AdminSearchForm";
import { adminNavigation } from "@/lib/navigation";
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const iconProps = {
  "aria-hidden": true as const,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function NavIcon({ href, className }: { href: string; className?: string }) {
  switch (href) {
    case "/admin":
      return (
        <svg {...iconProps} className={className}>
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6 10v9a1 1 0 0 0 1 1h3v-5.5a2 2 0 0 1 2-2 2 2 0 0 1 2 2V20h3a1 1 0 0 0 1-1v-9" />
        </svg>
      );
    case "/admin/events":
      return (
        <svg {...iconProps} className={className}>
          <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
          <path d="M4 10h16M8 3.5v3M16 3.5v3" />
        </svg>
      );
    case "/admin/registrations":
      return (
        <svg {...iconProps} className={className}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
          <path d="M16 9a2.5 2.5 0 1 0 0-5" />
          <path d="M15 13.7c2.4.5 4 2.6 4 5.3" />
        </svg>
      );
    case "/admin/requests":
      return (
        <svg {...iconProps} className={className}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
          <path d="m4 6.5 8 6.5 8-6.5" />
        </svg>
      );
    case "/admin/settings":
      return (
        <svg {...iconProps} className={className}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5M17.7 17.7l-1.5-1.5M7.8 7.8 6.3 6.3" />
        </svg>
      );
    default:
      return null;
  }
}

export function AdminSidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="sticky top-0 hidden h-screen overflow-y-auto overscroll-contain bg-[var(--brand-forest)] px-5 py-6 text-[var(--color-on-primary)] lg:block">
      <Link href="/admin" aria-label="لوحة إدارة نادي بَيْن الثقافي" className="flex items-center gap-3 border-b border-white/18 pb-6">
        <ClubLogo variant="on-green" className="h-auto w-24" priority />
        <span className="font-bold">الإدارة</span>
      </Link>
      <AdminSearchForm
        className="mt-5"
        id="admin-sidebar-search"
        inputClassName="min-h-10 w-full rounded-[var(--radius-control)] border border-white/25 bg-white/10 px-3 text-sm text-white placeholder:text-white/60 focus:bg-white/15"
      />
      <nav aria-label="أقسام لوحة الإدارة" className="mt-6">
        <ul className="grid gap-1">
          {adminNavigation.map((item) => {
            const matches = item.activePrefixes ?? [item.href];
            const isActive =
              item.href === "/admin" ? pathname === item.href : matches.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-[var(--radius-control)] px-4 py-2.5 text-sm transition-colors duration-[var(--duration-standard)] ${
                    isActive
                      ? "bg-[var(--brand-amber)] font-bold text-[var(--brand-forest)]"
                      : "font-medium text-white/82 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <NavIcon href={item.href} className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <form action={logoutAction} className="mt-8 border-t border-white/15 pt-5">
        <button type="submit" className="w-full rounded-[var(--radius-control)] border border-white/35 px-4 py-2.5 text-sm font-bold hover:bg-white/10">
          تسجيل الخروج
        </button>
      </form>
    </aside>
  );
}
