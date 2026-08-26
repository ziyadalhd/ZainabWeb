import type { ReactNode } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/(dashboard)/admin/actions";
import { ClubLogo } from "@/components/brand/ClubLogo";

export function MfaPageShell({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: ReactNode;
}>) {
  return (
    <main className="grid min-h-screen bg-[var(--brand-cream)] lg:grid-cols-[minmax(0,0.72fr)_minmax(28rem,1fr)]">
      <aside className="hidden bg-[var(--brand-forest)] p-10 text-[var(--color-on-primary)] lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="w-fit bg-[var(--brand-cream)] p-4" aria-label="العودة إلى موقع نادي بَيْن الثقافي">
          <ClubLogo className="h-auto w-40" priority />
        </Link>
        <div className="max-w-sm border-r-4 border-[var(--brand-amber)] pr-5">
          <p className="text-4xl font-black leading-tight">حماية إضافية للوحة الإدارة</p>
          <p className="mt-4 text-sm leading-7 text-white/75">رمز مؤقت من تطبيق المصادقة يحمي بيانات التسجيلات وطلبات النادي.</p>
        </div>
      </aside>

      <div className="grid place-items-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mx-auto flex w-fit items-center lg:hidden" aria-label="العودة إلى موقع نادي بَيْن الثقافي">
            <ClubLogo className="h-auto w-32" priority />
          </Link>
          <header className="mt-8 border-r-4 border-[var(--brand-amber)] pr-5">
            <p className="text-sm font-extrabold text-[var(--brand-olive)]">التحقق بخطوتين</p>
            <h1 className="mt-2 text-3xl font-black text-[var(--brand-forest)] sm:text-4xl">{title}</h1>
            <p className="mt-3 leading-7 muted-copy">{description}</p>
          </header>
          {children}
          <form action={logoutAction} className="mt-5 text-center">
            <button type="submit" className="button-quiet min-h-11 px-4 py-2 text-sm">
              الخروج من الحساب
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
