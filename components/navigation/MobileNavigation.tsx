"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { NavigationItem } from "@/lib/navigation";

export function MobileNavigation({ items, label = "القائمة" }: { items: readonly NavigationItem[]; label?: string }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation-panel"
        onClick={() => setOpen((value) => !value)}
        className="button-secondary min-w-11 gap-2 bg-[var(--brand-cream)]"
      >
        <span aria-hidden="true" className="text-xl leading-none">
          {open ? "×" : "☰"}
        </span>
        {label}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-[rgb(24_54_30/0.42)]" role="presentation">
          <button type="button" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} className="absolute inset-0 size-full cursor-default" />
          <nav
            ref={panelRef}
            id="mobile-navigation-panel"
            aria-label="التنقل للجوال"
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const focusable = Array.from(
                panelRef.current?.querySelectorAll<HTMLElement>(
                  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
                ) ?? [],
              );
              if (focusable.length === 0) return;
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }}
            className="absolute inset-x-0 bottom-0 max-h-[min(82vh,44rem)] overflow-y-auto overscroll-contain border-t-4 border-[var(--brand-amber)] bg-[var(--brand-cream)] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-18px_50px_rgb(24_54_30/0.16)]"
          >
            <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <strong className="text-lg text-[var(--brand-forest)]">التنقل</strong>
              <button type="button" onClick={() => setOpen(false)} className="button-quiet min-w-11" aria-label="إغلاق القائمة">
                ×
              </button>
            </div>
            <ul className="grid gap-1">
              {items.map((item, index) => {
                const matches = item.activePrefixes ?? [item.href];
                const isActive =
                  item.href === "/admin" ? pathname === item.href : matches.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
                return (
                  <li key={item.href}>
                    <Link
                      ref={index === 0 ? firstLinkRef : undefined}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-12 items-center justify-between border-b border-[var(--color-border)] px-2 py-3 font-bold text-[var(--brand-forest)] hover:bg-white/55 ${isActive ? "bg-[var(--color-surface-strong)]" : ""}`}
                    >
                      {item.label}
                      <span aria-hidden="true">←</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
