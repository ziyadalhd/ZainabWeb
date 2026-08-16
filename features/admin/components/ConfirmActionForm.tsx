"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

interface ConfirmActionFormProps {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  confirmation: string;
  tone?: "danger" | "quiet";
}

function ConfirmSubmitButton({ tone }: { tone: "danger" | "quiet" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${tone === "danger" ? "button-danger" : "button-secondary"} min-h-10 px-3 py-2 text-sm`}>
      {pending ? "جارٍ التنفيذ…" : "تأكيد"}
    </button>
  );
}

export function ConfirmActionForm({ action, label, confirmation, tone = "danger" }: ConfirmActionFormProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        className={`${tone === "danger" ? "button-danger" : "button-quiet"} min-h-10 px-3 py-2 text-sm`}
        onClick={() => setConfirming(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <form action={action} className="admin-confirm-action" aria-label={`تأكيد ${label}`}>
      <p className="text-sm font-bold">{confirmation}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <ConfirmSubmitButton tone={tone} />
        <button type="button" className="button-quiet min-h-10 px-3 py-2 text-sm" onClick={() => setConfirming(false)}>
          تراجع
        </button>
      </div>
    </form>
  );
}
