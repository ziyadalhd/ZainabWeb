"use client";

import { useActionState, useState } from "react";

interface ServiceRequestCancelActionProps {
  action: () => Promise<{ error?: string; cancelled?: true }>;
}

export function ServiceRequestCancelAction({ action }: ServiceRequestCancelActionProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});
  if (state.cancelled) return <p role="status" className="font-bold text-[var(--color-success-text)]">تم إلغاء الطلب.</p>;
  if (!confirming) return <button type="button" onClick={() => setConfirming(true)} className="min-h-11 rounded-xl border border-[var(--color-error-text)] px-4 py-2 text-sm font-extrabold text-[var(--color-error-text)]">إلغاء الطلب</button>;
  return <form action={formAction} className="flex flex-wrap items-center gap-3"><span className="text-sm font-bold">هل تريدين الإلغاء؟</span><button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-[var(--color-error-text)] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60">{pending ? "جارٍ الإلغاء…" : "تأكيد الإلغاء"}</button><button type="button" onClick={() => setConfirming(false)} className="min-h-11 px-3 text-sm font-bold underline">تراجع</button>{state.error ? <p role="alert" className="w-full text-sm font-bold text-[var(--color-error-text)]">{state.error}</p> : null}</form>;
}
