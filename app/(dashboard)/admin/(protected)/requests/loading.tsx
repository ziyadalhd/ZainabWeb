export default function RequestsLoading() {
  return (
    <main className="admin-page" aria-busy="true" aria-label="جارٍ تحميل الطلبات">
      <div className="grid animate-pulse gap-3">
        <div className="h-4 w-24 rounded-full bg-[var(--color-border)]" />
        <div className="h-10 w-40 rounded-full bg-[var(--color-border)]" />
      </div>
      <div className="mt-7 flex animate-pulse flex-wrap items-end gap-2">
        <div className="h-11 w-64 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
        <div className="h-11 w-40 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
        <div className="h-11 w-20 rounded-[var(--radius-control)] bg-[var(--color-border)]" />
      </div>
      <div className="mt-5 h-4 w-20 animate-pulse rounded-full bg-[var(--color-border)]" />
      <div className="mt-4 grid animate-pulse gap-5">
        <div className="h-48 rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
        <div className="h-48 rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
        <div className="h-48 rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
      </div>
    </main>
  );
}
