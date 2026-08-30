import { eventLifecycleLabels, eventLifecycleTone, type EventLifecycle } from "@/features/admin/event-lifecycle";

const toneClass = {
  positive: "border-[var(--brand-olive)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  warning: "border-[var(--brand-amber)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  neutral: "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)]",
  danger: "border-[var(--color-error-text)] bg-[var(--color-error-bg)] text-[var(--color-error-text)]",
} as const;

export function LifecycleBadge({ lifecycle }: { lifecycle: EventLifecycle }) {
  const tone = eventLifecycleTone[lifecycle];
  return (
    <span
      className={`inline-flex items-center rounded-control border px-2.5 py-1 text-xs font-medium transition-colors duration-[var(--duration-standard)] ease-[var(--ease-standard)] ${toneClass[tone]}`}
    >
      {eventLifecycleLabels[lifecycle]}
    </span>
  );
}
