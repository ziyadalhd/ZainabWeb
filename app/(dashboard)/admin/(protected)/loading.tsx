export default function AdminSectionLoading() {
  return (
    <main className="admin-page" aria-busy="true" aria-label="جارٍ تحميل الصفحة">
      <div className="grid animate-pulse gap-3">
        <div className="h-4 w-32 rounded-full bg-[var(--color-border)]" />
        <div className="h-10 w-2/3 rounded-full bg-[var(--color-border)]" />
      </div>
      <div className="mt-8 grid animate-pulse gap-3">
        <div className="h-24 rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
        <div className="h-24 rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
        <div className="h-24 rounded-[var(--radius-surface)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
      </div>
    </main>
  );
}
