import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { MfaManagementPanel } from "@/features/admin/components/MfaManagementPanel";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "الأمان والتحقق بخطوتين" };

export default async function AdminSecurityPage() {
  await requireAdmin();

  return (
    <main className="admin-page">
      <PageHeader
        eyebrow="لوحة الإدارة"
        title="الأمان والتحقق بخطوتين"
        description="أضيفي جهازًا احتياطيًا أو استبدلي جهازك القديم بدون تعطيل حماية حساب الإدارة."
      />
      <MfaManagementPanel />
    </main>
  );
}
