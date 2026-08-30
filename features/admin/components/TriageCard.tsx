import Link from "next/link";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { TriageAction, TriageIcon, TriageItem } from "@/features/admin/attention-items";
import type { ActionResult } from "@/lib/data/action-result";

const iconProps = {
  "aria-hidden": true as const,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Icon({ icon, className }: { icon: TriageIcon; className?: string }) {
  switch (icon) {
    case "clock":
      return (
        <svg {...iconProps} className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "request":
      return (
        <svg {...iconProps} className={className}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
          <path d="m4 6.5 8 6.5 8-6.5" />
        </svg>
      );
    case "card":
      return (
        <svg {...iconProps} className={className}>
          <rect x="2.5" y="6" width="19" height="12" rx="2" />
          <path d="M2.5 10h19" />
          <path d="M6 14.5h4" />
        </svg>
      );
    case "envelope":
      return (
        <svg {...iconProps} className={className}>
          <path d="M4 5h16v11H8l-4 3z" />
        </svg>
      );
    case "draft":
      return (
        <svg {...iconProps} className={className}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case "seat":
      return (
        <svg {...iconProps} className={className}>
          <circle cx="9" cy="7" r="3" />
          <path d="M3.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
          <path d="M14 11h6M17 8v6" />
        </svg>
      );
    default:
      return null;
  }
}

export interface TriageRunners {
  confirmInvitation: (itemId: string, registrationId: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;
  revokeInvitation: (itemId: string, registrationId: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;
}

function actionClassName(variant: TriageAction["variant"]): string {
  return `${variant === "primary" ? "button-primary" : "button-secondary"} min-h-10 px-3 py-2 text-sm`;
}

function renderAction(action: TriageAction, itemId: string, runners: TriageRunners, key: number) {
  const className = actionClassName(action.variant);
  if (action.kind === "link") {
    return (
      <Link key={key} href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }
  if (action.kind === "confirm-invitation") {
    return (
      <ActionButton
        key={key}
        action={runners.confirmInvitation.bind(null, itemId, action.registrationId)}
        label={action.label}
        pendingLabel="جارٍ التأكيد…"
        className={className}
        successMessage="تم تأكيد الدعوة وتحويل المقعد إلى مسجَّل."
      />
    );
  }
  return (
    <ConfirmDialog
      key={key}
      triggerLabel={action.label}
      triggerClassName={className}
      tone="default"
      title="سحب الدعوة"
      description="هل تريدين سحب هذه الدعوة وإعادة صاحبتها لقائمة الانتظار؟"
      confirmLabel="سحب الدعوة"
      action={runners.revokeInvitation.bind(null, itemId, action.registrationId)}
      successMessage="تم سحب الدعوة وإعادة السجل إلى قائمة الانتظار."
    />
  );
}

export function TriageCard({ item, runners }: { item: TriageItem; runners: TriageRunners }) {
  return (
    <li className="triage-card" aria-label={`${item.subjectName} — ${item.urgencyLabel}`}>
      <Icon icon={item.icon} className="triage-card__icon" />
      <div className="triage-card__body">
        <div className="triage-card__heading">
          <span className="triage-card__subject">{item.subjectName}</span>
          <span className={`triage-card__tag triage-card__tag--${item.tone}`}>{item.urgencyLabel}</span>
        </div>
        <p className="triage-card__context">{item.context}</p>
      </div>
      <div className="triage-card__actions">{item.actions.map((action, index) => renderAction(action, item.id, runners, index))}</div>
    </li>
  );
}
