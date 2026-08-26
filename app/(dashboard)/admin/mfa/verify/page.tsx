import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MfaPageShell } from "@/features/admin/components/MfaPageShell";
import { MfaVerifyForm } from "@/features/admin/components/MfaVerifyForm";
import { getAdminMfaDestination } from "@/lib/auth/mfa";
import { requireAdminFirstFactor } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "التحقق بخطوتين" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminMfaVerifyPage() {
  const session = await requireAdminFirstFactor();
  const destination = getAdminMfaDestination(session.currentLevel, session.nextLevel);

  if (destination !== "/admin/mfa/verify") redirect(destination);

  return (
    <MfaPageShell title="أدخلي رمز التحقق" description="تم قبول البريد وكلمة المرور. بقي الرمز المؤقت من تطبيق المصادقة.">
      <MfaVerifyForm />
    </MfaPageShell>
  );
}
