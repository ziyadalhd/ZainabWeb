"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastTone = "success" | "error";

/** An optional follow-up offered inside the toast: a link somewhere, or a one-shot control. */
export interface ToastAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  actions: readonly ToastAction[];
  leaving: boolean;
}

interface ToastContextValue {
  pushToast: (message: string, tone?: ToastTone, actions?: readonly ToastAction[]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}

const TOAST_LIFETIME_MS = 5000;
// Kept in sync with the --duration-standard token (app/globals.css); JS timers can't read
// CSS custom properties, so the exit animation's length is mirrored here.
const TOAST_EXIT_MS = 200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);
  const nextId = useRef(0);

  const pushToast = useCallback((message: string, tone: ToastTone = "success", actions: readonly ToastAction[] = []) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, tone, actions, leaving: false }]);
    window.setTimeout(() => {
      setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
    }, TOAST_LIFETIME_MS - TOAST_EXIT_MS);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_LIFETIME_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="toast-region">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={`toast toast--${toast.tone}${toast.leaving ? " toast--leaving" : ""}`}
          >
            <p>{toast.message}</p>
            {toast.actions.length > 0 ? (
              <div className="toast__actions">
                {toast.actions.map((action) =>
                  action.href ? (
                    <Link key={action.label} href={action.href} className="toast__action">
                      {action.label}
                    </Link>
                  ) : (
                    <button key={action.label} type="button" className="toast__action" onClick={action.onClick}>
                      {action.label}
                    </button>
                  ),
                )}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
