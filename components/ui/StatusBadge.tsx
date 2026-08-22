const labels = {
  available: "متاح",
  full: "مكتمل",
  open: "مفتوح",
  closed: "مغلق",
  pending: "بانتظار التأكيد",
  check_in_pending: "لم يسجل الحضور",
  confirmed: "تم التأكيد",
  checked_in: "تم الحضور",
  absent: "غياب",
  cancelled: "ملغي",
  registered: "مسجل",
  waitlisted: "قائمة انتظار",
  invited: "دعوة مرسلة",
  draft: "مسودة",
  published: "منشورة",
  archived: "مؤرشفة",
  subscribed: "موافقة سارية",
  unsubscribed: "ألغت الاشتراك",
  unpaid: "غير مدفوع",
  deposit_paid: "دُفع العربون",
  paid_in_full: "مدفوع بالكامل",
} as const;

export type StatusBadgeValue = keyof typeof labels;

const statusTone: Record<StatusBadgeValue, "positive" | "warning" | "neutral" | "danger"> = {
  available: "positive",
  full: "warning",
  open: "positive",
  closed: "neutral",
  pending: "warning",
  check_in_pending: "neutral",
  confirmed: "positive",
  checked_in: "positive",
  absent: "danger",
  registered: "positive",
  waitlisted: "warning",
  invited: "warning",
  draft: "neutral",
  published: "positive",
  archived: "neutral",
  cancelled: "danger",
  subscribed: "positive",
  unsubscribed: "neutral",
  unpaid: "warning",
  deposit_paid: "warning",
  paid_in_full: "positive",
};

const toneClass = {
  positive: "border-[var(--brand-olive)] bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  warning: "border-[var(--brand-amber)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  neutral: "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text)]",
  danger: "border-[var(--color-error-text)] bg-[var(--color-error-bg)] text-[var(--color-error-text)]",
} as const;

export function StatusBadge({ status }: { status: StatusBadgeValue }) {
  const tone = statusTone[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 text-xs font-extrabold ${toneClass[tone]}`}
    >
      <span aria-hidden="true" className="font-black">{tone === "danger" ? "!" : tone === "warning" ? "•" : tone === "positive" ? "✓" : "—"}</span>
      {labels[status]}
    </span>
  );
}
