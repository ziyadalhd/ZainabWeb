import type { Metadata } from "next";
import Link from "next/link";
import { ClubLogo } from "@/components/brand/ClubLogo";
import { ResetPasswordForm } from "@/features/admin/components/ResetPasswordForm";

export const metadata: Metadata = { title: "استعادة كلمة المرور" };

export default function ResetPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--surface-soft)] px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/admin/login" className="mx-auto flex w-fit items-center gap-3" aria-label="العودة إلى دخول المسؤول">
          <ClubLogo className="h-auto w-24" priority />
          <span className="font-extrabold text-[var(--brand-green-deep)]">نادي بَيْن الثقافي</span>
        </Link>
        <header className="mt-8 text-center">
          <h1 className="text-3xl font-extrabold text-[var(--brand-green-deep)]">تعيين كلمة مرور جديدة</h1>
          <p className="mt-2 muted-copy">هذه الصفحة مخصصة لرابط الاستعادة المرسل إلى حساب المسؤول.</p>
        </header>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
