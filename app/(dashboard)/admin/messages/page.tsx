import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "الرسائل" };

export default function MessagesPage() {
  return <main className="px-4 py-8 sm:px-8"><PageHeader eyebrow="لوحة الإدارة" title="الرسائل" /><EmptyState title="خدمة الرسائل غير مهيأة" description="لم يُعتمد مزود أو قناة لإرسال الرسائل والتذكيرات." /></main>;
}
