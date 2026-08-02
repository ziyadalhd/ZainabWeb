const labels = {
  available: "متاح",
  full: "مكتمل",
  pending: "بانتظار التأكيد",
  confirmed: "تم التأكيد",
  cancelled: "ملغي",
} as const;

export type StatusBadgeValue = keyof typeof labels;

export function StatusBadge({ status }: { status: StatusBadgeValue }) {
  const positive = status === "available" || status === "confirmed";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold ${positive ? "bg-[#e8f0e3] text-[var(--brand-green-deep)]" : "bg-zinc-100 text-zinc-700"}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${positive ? "bg-[var(--brand-green)]" : "bg-zinc-500"}`} />
      {labels[status]}
    </span>
  );
}
