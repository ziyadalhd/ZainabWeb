export default function RegistrationsLoading() {
  return (
    <main className="admin-page" aria-busy="true" aria-label="جارٍ تحميل التسجيلات">
      <div className="grid animate-pulse gap-3">
        <div className="h-4 w-24 rounded-full bg-[var(--color-border)]" />
        <div className="h-10 w-56 rounded-full bg-[var(--color-border)]" />
      </div>
      <div className="mt-7 flex animate-pulse flex-wrap gap-2">
        <div className="h-11 w-24 rounded-full bg-[var(--color-border)]" />
        <div className="h-11 w-40 rounded-full bg-[var(--color-border)]" />
        <div className="h-11 w-36 rounded-full bg-[var(--color-border)]" />
      </div>
      <div className="mt-5 h-11 w-full max-w-md animate-pulse rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
      <div className="mt-6 grid animate-pulse gap-4 lg:grid-cols-[minmax(18rem,0.42fr)_minmax(0,1fr)]">
        <div className="grid gap-3">
          <div className="h-20 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
          <div className="h-20 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
          <div className="h-20 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
          <div className="h-20 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
        </div>
        <div className="h-[28rem] rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
      </div>
    </main>
  );
}
