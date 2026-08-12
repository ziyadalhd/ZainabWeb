"use client";

import { thmanyahSans } from "./fonts";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl" className={thmanyahSans.variable}>
      <body className="bg-[var(--brand-cream)] text-[var(--color-text)]">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-black text-[var(--brand-forest)]">تعذر تشغيل الصفحة</h1>
          <p className="mt-4 text-[var(--color-text-muted)]">حدث خطأ عام. حاول إعادة تحميل الواجهة.</p>
          <button type="button" onClick={reset} className="button-primary mt-7 px-6 py-3">
            إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  );
}
