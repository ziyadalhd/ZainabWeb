interface StatCardProps {
  label: string;
  value: number | string;
  note?: string;
}

export function StatCard({ label, value, note }: StatCardProps) {
  return (
    <article className="rounded-3xl border border-[var(--border)] bg-white p-5">
      <p className="text-sm font-bold muted-copy">{label}</p>
      <p className="mt-3 text-3xl font-extrabold text-[var(--brand-green-deep)]">{value}</p>
      {note ? <p className="mt-2 text-xs muted-copy">{note}</p> : null}
    </article>
  );
}
