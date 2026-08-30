"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ToastProvider } from "@/components/ui/ToastProvider";

interface OverlayProps {
  closeHref: string;
  triggerId?: string;
  label: string;
  className: string;
  bodyClassName: string;
  closeButtonClassName: string;
  closeLabel: string;
  /**
   * Optional content rendered as the close button's flex sibling inside `headerClassName`, so a
   * consumer can put a title and controls in the same header row as the close button instead of
   * it floating alone. Omitted (EventPanel's case): the close button renders exactly as before,
   * alone, with no header wrapper — unchanged markup, unchanged behavior.
   */
  headerClassName?: string;
  headerContent?: ReactNode;
  children: ReactNode;
}

/**
 * A native `<dialog>` overlay: opens itself on mount, closes on backdrop click or Escape (both
 * fire the dialog's own "close" event, which is all this listens for), navigates to `closeHref`
 * on close, and restores focus to `triggerId` first. `EventPanel` and `CalendarOverlay` are thin
 * skins over this — the CSS classes carry each surface's own size, position, and chrome.
 */
export function Overlay({
  closeHref,
  triggerId,
  label,
  className,
  bodyClassName,
  closeButtonClassName,
  closeLabel,
  headerClassName,
  headerContent,
  children,
}: OverlayProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    const hash = window.location.hash.slice(1);
    if (hash) document.getElementById(hash)?.scrollIntoView({ block: "start" });
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      if (triggerId) document.getElementById(triggerId)?.focus();
      router.push(closeHref, { scroll: false });
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-bind only when the destination or trigger changes, not on every router identity change
  }, [closeHref, triggerId]);

  return (
    <dialog
      ref={dialogRef}
      className={className}
      aria-label={label}
      onClick={(clickEvent) => {
        if (clickEvent.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      <ToastProvider>
        <div className={bodyClassName}>
          {headerContent ? (
            <div className={headerClassName}>
              {headerContent}
              <button type="button" className={closeButtonClassName} onClick={() => dialogRef.current?.close()} aria-label={closeLabel}>
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          ) : (
            <button type="button" className={closeButtonClassName} onClick={() => dialogRef.current?.close()} aria-label={closeLabel}>
              <span aria-hidden="true">✕</span>
            </button>
          )}
          {children}
        </div>
      </ToastProvider>
    </dialog>
  );
}
