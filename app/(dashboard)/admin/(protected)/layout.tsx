import type { ReactNode } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] lg:grid lg:grid-cols-[17rem_1fr]">
      <AdminSidebar />
      <div className="min-w-0">
        <AdminHeader />
        <div role="status" className="border-b border-[#d9c989] bg-[#fff7d6] px-4 py-2 text-center text-xs font-bold text-[#5e4b12]">
          إدارة الفعاليات والتسجيلات مفعلة. إرسال WhatsApp يتم يدويًا، ولا يوجد تحصيل إلكتروني.
        </div>
        {children}
      </div>
    </div>
  );
}
