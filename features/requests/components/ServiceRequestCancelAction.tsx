"use client";

import { useActionState, useState } from "react";

interface ServiceRequestCancelActionProps {
  action: () => Promise<{ error?: string; cancelled?: true }>;
}

export function ServiceRequestCancelAction({ action }: ServiceRequestCancelActionProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});
  if (state.cancelled) return <p role="status" className="font-bold text-[var(--color-success-text)]">تم إلغاء الطلب.</p>;
  if (!confirming) return <button type="button" onClick={() => setConfirming(true)} className="button-danger px-4 py-2 text-sm">إلغاء الطلب</button>;
  return <form action={formAction} className="notice-warning flex flex-wrap items-center gap-3"><span className="text-sm font-bold">هل تريدين الإلغاء؟</span><button type="submit" disabled={pending} className="button-danger bg-[var(--color-surface)] px-4 py-2 text-sm">{pending ? "جارٍ الإلغاء…" : "تأكيد الإلغاء"}</button><button type="button" onClick={() => setConfirming(false)} className="button-quiet px-3 py-2 text-sm">تراجع</button>{state.error ? <p role="alert" className="w-full text-sm font-bold text-[var(--color-error-text)]">{state.error}</p> : null}</form>;
}
