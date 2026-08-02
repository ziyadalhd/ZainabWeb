import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export const metadata: Metadata = {
  title: { default: "لوحة الإدارة", template: "%s | لوحة الإدارة" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[var(--surface-soft)] lg:grid lg:grid-cols-[17rem_1fr]">
      <AdminSidebar />
      <div className="min-w-0">
        <AdminHeader />
        <div role="status" className="border-b border-[#d9c989] bg-[#fff7d6] px-4 py-2 text-center text-xs font-bold text-[#5e4b12]">
          واجهة تجريبية للعرض فقط — لا تستخدم بيانات حقيقية ولا تتصل بقاعدة بيانات أو خدمة رسائل.
        </div>
        {children}
      </div>
    </div>
  );
}
