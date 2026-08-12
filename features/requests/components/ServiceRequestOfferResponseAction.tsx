"use client";

import { useActionState, useState } from "react";

interface ServiceRequestOfferResponseActionProps {
  acceptAction: () => Promise<{ error?: string; responded?: "accepted" | "rejected" }>;
  rejectAction: () => Promise<{ error?: string; responded?: "accepted" | "rejected" }>;
}
export function ServiceRequestOfferResponseAction({ acceptAction, rejectAction }: ServiceRequestOfferResponseActionProps) {
  const [choice, setChoice] = useState<"accepted" | "rejected" | null>(null);
  const action = choice === "accepted" ? acceptAction : rejectAction;
  const [state, formAction, pending] = useActionState(action, {});
  if (state.responded === "accepted") return <p role="status" className="font-extrabold text-[var(--color-success-text)]">تم قبول العرض.</p>;
  if (state.responded === "rejected") return <p role="status" className="font-extrabold text-[var(--color-success-text)]">تم رفض العرض.</p>;
  if (choice) {
    return <form action={formAction} className="notice-warning flex flex-wrap items-center gap-3"><span className="text-sm font-bold">{choice === "accepted" ? "هل تريدين قبول العرض؟" : "هل تريدين رفض العرض؟"}</span><button type="submit" disabled={pending} className="button-primary px-4 py-2 text-sm">{pending ? "جارٍ الحفظ…" : "تأكيد"}</button><button type="button" onClick={() => setChoice(null)} className="button-quiet px-3 py-2 text-sm">تراجع</button>{state.error ? <p role="alert" className="w-full text-sm font-bold text-[var(--color-error-text)]">{state.error}</p> : null}</form>;
  }
  return <div className="flex flex-wrap gap-3"><button type="button" onClick={() => setChoice("accepted")} className="button-primary px-4 py-2 text-sm">قبول العرض</button><button type="button" onClick={() => setChoice("rejected")} className="button-danger px-4 py-2 text-sm">رفض العرض</button></div>;
}
