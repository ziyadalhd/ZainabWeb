"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page-shell section-space">
      <p className="eyebrow">خطأ</p>
      <h1 className="mt-3 text-3xl font-black text-[var(--brand-forest)]">تعذر عرض الصفحة</h1>
      <p className="mx-auto mt-4 max-w-xl muted-copy">جرّبي إعادة المحاولة. إن تكرر الخطأ، حدّثي الصفحة.</p>
      <button
        type="button"
        onClick={reset}
        className="button-primary mt-7 px-6 py-3"
      >
        إعادة المحاولة
      </button>
    </main>
  );
}
