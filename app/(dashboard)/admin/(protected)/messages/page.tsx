import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "الرسائل" };
export default async function MessagesPage() { await requireAdmin(); return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="لوحة الإدارة" title="الرسائل" /><EmptyState title="الإرسال الآلي غير مفعّل" description="يمكن فتح رسائل WhatsApp المجهزة يدويًا من صفحات المسجلين وقائمة الانتظار. لم يُعتمد مزود إرسال آلي بعد." /></main>; }
