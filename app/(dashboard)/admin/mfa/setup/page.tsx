import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MfaPageShell } from "@/features/admin/components/MfaPageShell";
import { MfaSetupForm } from "@/features/admin/components/MfaSetupForm";
import { getAdminMfaDestination } from "@/lib/auth/mfa";
import { requireAdminFirstFactor } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "إعداد التحقق بخطوتين" };

export default async function AdminMfaSetupPage() {
  const session = await requireAdminFirstFactor();
  const destination = getAdminMfaDestination(session.currentLevel, session.nextLevel);

  if (destination !== "/admin/mfa/setup") redirect(destination);

  return (
    <MfaPageShell
      title="إعداد تطبيق المصادقة"
      description="هذه الخطوة مطلوبة مرة واحدة لحماية لوحة الإدارة حتى لو عُرفت كلمة المرور."
    >
      <MfaSetupForm />
    </MfaPageShell>
  );
}
