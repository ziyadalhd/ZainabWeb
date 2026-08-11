interface StatCardProps {
  label: string;
  value: number | string;
  note?: string;
}

export function StatCard({ label, value, note }: StatCardProps) {
  return (
    <article className="border-r-4 border-[var(--brand-olive)] bg-[var(--color-surface)] p-5">
      <p className="text-sm font-bold muted-copy">{label}</p>
      <p className="data-value mt-2 text-3xl font-black leading-none text-[var(--brand-forest)]">{value}</p>
      {note ? <p className="mt-3 text-xs leading-5 muted-copy">{note}</p> : null}
    </article>
  );
}
