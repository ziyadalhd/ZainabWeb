import type { Metadata } from "next";
import Link from "next/link";
import { ClubLogo } from "@/components/brand/ClubLogo";
import { LoginForm } from "@/features/admin/components/LoginForm";

export const metadata: Metadata = { title: "دخول المسؤول" };

const errorMessages: Record<string, string> = {
  invalid: "تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.",
  unauthorized: "هذا الحساب غير معتمد لإدارة النادي.",
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--surface-soft)] px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mx-auto flex w-fit items-center gap-3" aria-label="العودة إلى موقع نادي بَيْن الثقافي">
          <ClubLogo className="h-auto w-24" priority />
          <span className="font-extrabold text-[var(--brand-green-deep)]">نادي بَيْن الثقافي</span>
        </Link>
        <header className="mt-8 text-center">
          <h1 className="text-3xl font-extrabold text-[var(--brand-green-deep)]">دخول لوحة الإدارة</h1>
          <p className="mt-2 muted-copy">هذه الصفحة مخصصة لحساب المسؤول المعتمد فقط.</p>
        </header>
        <LoginForm errorMessage={error ? errorMessages[error] : undefined} />
      </div>
    </main>
  );
}
