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
} as const;

export type StatusBadgeValue = keyof typeof labels;

export function StatusBadge({ status }: { status: StatusBadgeValue }) {
  const positive = status === "available" || status === "open" || status === "confirmed" || status === "checked_in" || status === "published" || status === "registered" || status === "subscribed";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ${positive ? "bg-[#e8f0e3] text-[var(--brand-green-deep)]" : "bg-zinc-100 text-zinc-700"}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${positive ? "bg-[var(--brand-green)]" : "bg-zinc-500"}`} />
      {labels[status]}
    </span>
  );
}
