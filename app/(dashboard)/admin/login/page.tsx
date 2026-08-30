import type { Metadata } from "next";
import Link from "next/link";
import { ClubLogo } from "@/components/brand/ClubLogo";
import { LoginForm } from "@/features/admin/components/LoginForm";

export const metadata: Metadata = { title: "دخول المسؤول" };
export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  invalid: "تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.",
  unauthorized: "هذا الحساب غير معتمد لإدارة النادي.",
  session: "تعذر التحقق من جلسة الدخول. سجلي الدخول مرة أخرى.",
};

const successMessages: Record<string, string> = {
  "password-reset": "تم تعيين كلمة المرور. سجلي الدخول بكلمة المرور الجديدة.",
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const { error, success } = await searchParams;

  return (
    <main className="grid min-h-screen bg-[var(--brand-cream)] lg:grid-cols-[minmax(0,0.72fr)_minmax(28rem,1fr)]">
      <aside className="hidden bg-[var(--brand-forest)] p-10 text-[var(--color-on-primary)] lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="w-fit bg-[var(--brand-cream)] p-4" aria-label="العودة إلى موقع نادي بَيْن الثقافي">
          <ClubLogo className="h-auto w-40" priority />
        </Link>
        <div className="max-w-sm border-r-4 border-[var(--brand-amber)] pr-5">
          <p className="text-4xl font-black leading-tight">لوحة إدارة الفعاليات والتسجيلات</p>
          <p className="mt-4 text-sm leading-7 text-white/75">الدخول مخصص للمسؤول المعتمد في نادي بَيْن الثقافي.</p>
        </div>
      </aside>
      <div className="grid place-items-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mx-auto flex w-fit items-center lg:hidden" aria-label="العودة إلى موقع نادي بَيْن الثقافي">
            <ClubLogo className="h-auto w-32" priority />
          </Link>
          <header className="mt-8 border-r-4 border-[var(--brand-amber)] pr-5">
            <h1 className="text-3xl font-black text-[var(--brand-forest)] sm:text-4xl">دخول لوحة الإدارة</h1>
            <p className="mt-3 leading-7 muted-copy">هذه الصفحة مخصصة لحساب المسؤول المعتمد فقط.</p>
          </header>
          {success && successMessages[success] ? (
            <p role="status" className="notice-success mt-6">
              {successMessages[success]}
            </p>
          ) : null}
          <LoginForm errorMessage={error ? errorMessages[error] : undefined} />
        </div>
      </div>
    </main>
  );
}
