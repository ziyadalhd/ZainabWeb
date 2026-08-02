"use client";

import { thmanyahSans } from "./fonts";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl" className={thmanyahSans.variable}>
      <body className="bg-[#fefdf1] text-[#172016]">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-extrabold text-[#243f1c]">تعذر تشغيل الصفحة</h1>
          <p className="mt-4 text-[#5f685c]">حدث خطأ عام. حاول إعادة تحميل الواجهة.</p>
          <button type="button" onClick={reset} className="mt-7 rounded-full bg-[#335828] px-6 py-3 font-bold text-[#fefdf1]">
            إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  );
}
