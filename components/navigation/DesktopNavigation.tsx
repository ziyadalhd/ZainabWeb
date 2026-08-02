import Link from "next/link";
import type { NavigationItem } from "@/lib/navigation";

export function DesktopNavigation({ items }: { items: readonly NavigationItem[] }) {
  return (
    <nav aria-label="التنقل الرئيسي" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="rounded-full px-3 py-2 text-sm font-bold text-[var(--brand-green-deep)] hover:bg-white/70">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
