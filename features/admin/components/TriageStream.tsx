"use client";

import { useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { TriageCard } from "@/features/admin/components/TriageCard";
import type { TriageItem } from "@/features/admin/attention-items";
import type { ActionResult } from "@/lib/data/action-result";

export interface TriageRegistrationActions {
  confirmInvitation: (id: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;
  revokeInvitation: (id: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;
}

interface TriageStreamProps {
  items: readonly TriageItem[];
  registrationActions: TriageRegistrationActions;
}

export function TriageStream({ items, registrationActions }: TriageStreamProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  // Removing the item optimistically (before the server round trip resolves) is what makes the
  // action feel like a single click rather than a navigation — see OPERATIONS_HUB_REDESIGN_PLAN.md
  // §3.2. The card unmounts synchronously, before its own ActionButton/ConfirmDialog can fire its
  // own success effect, so completion (toast + real refresh) is handled here instead — the same
  // pattern RegistrationTable uses for its own gating actions.
  const [optimisticItems, removeItem] = useOptimistic(items, (current: readonly TriageItem[], itemId: string) =>
    current.filter((item) => item.id !== itemId),
  );

  async function runAndRemove(itemId: string, successMessage: string, call: () => Promise<ActionResult>): Promise<ActionResult> {
    removeItem(itemId);
    const result = await call();
    if (result.status === "success") pushToast(successMessage, "success");
    else if (result.status === "error") pushToast(result.message ?? "تعذر تنفيذ الإجراء. حاولي مرة أخرى.", "error");
    router.refresh();
    return result;
  }

  const runners = {
    confirmInvitation: (itemId: string, registrationId: string, state: ActionResult, formData: FormData) =>
      runAndRemove(itemId, "تم تأكيد الدعوة وتحويل المقعد إلى مسجَّل.", () => registrationActions.confirmInvitation(registrationId, state, formData)),
    revokeInvitation: (itemId: string, registrationId: string, state: ActionResult, formData: FormData) =>
      runAndRemove(itemId, "تم سحب الدعوة وإعادة السجل إلى قائمة الانتظار.", () => registrationActions.revokeInvitation(registrationId, state, formData)),
  };

  if (optimisticItems.length === 0) {
    return (
      <div className="card-surface px-5 py-7">
        <p className="font-bold">لا توجد مهام تحتاج معالجة الآن.</p>
        <p className="mt-1 text-sm muted-copy">راجعي التقويم أو أنشئي فعالية جديدة عند الحاجة.</p>
      </div>
    );
  }

  return (
    <ul className="triage-stream" aria-label="قائمة المهام">
      {optimisticItems.map((item) => (
        <TriageCard key={item.id} item={item} runners={runners} />
      ))}
    </ul>
  );
}
