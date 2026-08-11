import Link from "next/link";
import type { NavigationItem } from "@/lib/navigation";

export function DesktopNavigation({ items }: { items: readonly NavigationItem[] }) {
  return (
    <nav aria-label="التنقل الرئيسي" className="hidden lg:block">
      <ul className="flex items-center gap-0.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="inline-flex min-h-11 items-center border-b-2 border-transparent px-3 py-2 text-sm font-bold text-[var(--brand-forest)] transition-[border-color,background-color] hover:border-[var(--brand-amber)] hover:bg-white/45">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
