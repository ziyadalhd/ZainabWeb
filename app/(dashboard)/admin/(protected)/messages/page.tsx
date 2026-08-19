import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "الرسائل" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MessagesPage() {
  await requireAdmin();
  return (
    <main className="admin-page">
      <PageHeader eyebrow="لوحة الإدارة" title="الرسائل" />
      <EmptyState
        title="التذكيرات جاهزة من قائمة المسجلات"
        description="افتحي صفحة المسجلات الحاليات، وجهّزي رسالة كل مشاركة باسمها واسم الفعالية ورابط تأكيدها، ثم افتحيها في WhatsApp وحددي أنها أُرسلت بعد الإرسال."
      />
    </main>
  );
}
