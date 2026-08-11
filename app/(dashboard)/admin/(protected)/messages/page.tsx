import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "الرسائل" };
export default async function MessagesPage() { await requireAdmin(); return <main className="admin-page"><PageHeader eyebrow="لوحة الإدارة" title="الرسائل" /><EmptyState title="التذكيرات اليدوية جاهزة من قائمة المسجلات" description="من صفحة المسجلين الحاليين يمكنك تجهيز رسالة WhatsApp باسم المسجّلة والفعالية ورابطها الآمن، ثم تعليمها كمرسلة بعد الإرسال الفعلي. الإرسال الآلي غير مفعّل ولم يُعتمد مزود WhatsApp بعد." /></main>; }
