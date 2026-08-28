export default function EventsLoading() {
  return (
    <main className="admin-page" aria-busy="true" aria-label="جارٍ تحميل الفعاليات">
      <div className="flex animate-pulse flex-wrap items-end justify-between gap-5">
        <div className="grid gap-3">
          <div className="h-4 w-20 rounded-full bg-[var(--color-border)]" />
          <div className="h-10 w-64 rounded-full bg-[var(--color-border)]" />
        </div>
        <div className="h-11 w-32 rounded-[var(--radius-control)] bg-[var(--color-border)]" />
      </div>
      <div className="mt-7 flex animate-pulse gap-2">
        <div className="h-11 w-20 rounded-full bg-[var(--color-border)]" />
        <div className="h-11 w-20 rounded-full bg-[var(--color-border)]" />
      </div>
      <div className="mt-6 animate-pulse overflow-hidden rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="h-12 bg-[var(--color-border)]/50" />
        <div className="grid gap-px bg-[var(--color-border)]">
          <div className="h-16 bg-[var(--color-surface)]" />
          <div className="h-16 bg-[var(--color-surface)]" />
          <div className="h-16 bg-[var(--color-surface)]" />
          <div className="h-16 bg-[var(--color-surface)]" />
          <div className="h-16 bg-[var(--color-surface)]" />
        </div>
      </div>
    </main>
  );
}
