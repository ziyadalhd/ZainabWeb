export default function AdminSectionLoading() {
  return (
    <main className="admin-page" aria-busy="true" aria-label="جارٍ تحميل الصفحة">
      <div className="grid animate-pulse gap-3">
        <div className="h-4 w-32 rounded-full bg-[var(--color-border)]" />
        <div className="h-10 w-2/3 rounded-full bg-[var(--color-border)]" />
      </div>
      <div className="mt-8 grid animate-pulse gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(19rem,0.85fr)]">
        <div className="h-[34rem] rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
        <div className="grid content-start gap-8">
          <div className="grid gap-4">
            <div className="h-6 w-40 rounded-full bg-[var(--color-border)]" />
            <div className="h-[5.5rem] rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
            <div className="h-[5.5rem] rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
            <div className="h-[5.5rem] rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
          </div>
          <div className="grid gap-3">
            <div className="h-4 w-24 rounded-full bg-[var(--color-border)]" />
            <div className="h-24 rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
          </div>
        </div>
      </div>
    </main>
  );
}
