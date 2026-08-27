"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ToastProvider } from "@/components/ui/ToastProvider";

interface EventPanelProps {
  closeHref: string;
  triggerId?: string;
  label: string;
  children: ReactNode;
}

export function EventPanel({ closeHref, triggerId, label, children }: EventPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    document.body.style.overflow = "hidden";
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
      className="event-panel"
      aria-label={label}
      onClick={(clickEvent) => {
        if (clickEvent.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      <ToastProvider>
        <div className="event-panel__body">
          <button type="button" className="event-panel__close" onClick={() => dialogRef.current?.close()} aria-label="إغلاق مساحة الفعالية">
            <span aria-hidden="true">✕</span>
          </button>
          {children}
        </div>
      </ToastProvider>
    </dialog>
  );
}
