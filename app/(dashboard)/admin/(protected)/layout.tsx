import type { ReactNode } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[var(--color-page)] lg:grid lg:grid-cols-[18rem_1fr]">
      <a className="skip-link" href="#admin-content">تخطي إلى المحتوى</a>
      <AdminSidebar />
      <div className="min-w-0">
        <AdminHeader />
        <div role="status" className="border-b border-[var(--color-border)] bg-[var(--color-warning-bg)] px-4 py-2 text-center text-xs font-bold text-[var(--color-warning-text)]">
          جهّزي رسائل التذكير من قائمة المسجلات، ثم أرسليها عبر WhatsApp.
        </div>
        <div id="admin-content" tabIndex={-1}>{children}</div>
      </div>
    </div>
  );
}
