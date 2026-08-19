import type { Metadata } from "next";
import Link from "next/link";
import { ClubLogo } from "@/components/brand/ClubLogo";
import { ResetPasswordForm } from "@/features/admin/components/ResetPasswordForm";

export const metadata: Metadata = { title: "استعادة كلمة المرور" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ResetPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--brand-cream)] px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/admin/login" className="mx-auto flex w-fit items-center" aria-label="العودة إلى دخول المسؤول">
          <ClubLogo className="h-auto w-32" priority />
        </Link>
        <header className="mt-8 border-r-4 border-[var(--brand-amber)] pr-5">
          <h1 className="text-3xl font-black text-[var(--brand-forest)]">تعيين كلمة مرور جديدة</h1>
          <p className="mt-3 leading-7 muted-copy">هذه الصفحة مخصصة لرابط الاستعادة المرسل إلى حساب المسؤول.</p>
        </header>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
