"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page-shell section-space">
      <p className="eyebrow">تعذر إكمال الطلب</p>
      <h1 className="mt-3 text-3xl font-black text-[var(--brand-forest)]">حدث خطأ غير متوقع</h1>
      <p className="mx-auto mt-4 max-w-xl muted-copy">لم نتمكن من عرض الصفحة. يمكنك المحاولة مرة أخرى.</p>
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
