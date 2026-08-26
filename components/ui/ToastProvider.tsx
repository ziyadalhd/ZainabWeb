"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastTone = "success" | "error";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  pushToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}

const TOAST_LIFETIME_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);
  const nextId = useRef(0);

  const pushToast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_LIFETIME_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="toast-region">
        {toasts.map((toast) => (
          <p key={toast.id} role={toast.tone === "error" ? "alert" : "status"} className={`toast toast--${toast.tone}`}>
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
