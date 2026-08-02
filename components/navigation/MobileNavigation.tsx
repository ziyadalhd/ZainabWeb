"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { NavigationItem } from "@/lib/navigation";

export function MobileNavigation({ items, label = "القائمة" }: { items: readonly NavigationItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation-panel"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 font-bold text-[var(--brand-green-deep)]"
      >
        <span aria-hidden="true">{open ? "×" : "☰"}</span>
        {label}
      </button>
      {open ? (
        <nav
          id="mobile-navigation-panel"
          aria-label="التنقل للجوال"
          className="absolute inset-x-4 top-[calc(100%+0.5rem)] z-50 rounded-3xl border border-[var(--border)] bg-[var(--brand-ivory)] p-3 shadow-2xl"
        >
          <ul className="grid gap-1">
            {items.map((item, index) => (
              <li key={item.href}>
                <Link
                  ref={index === 0 ? firstLinkRef : undefined}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 font-bold hover:bg-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
