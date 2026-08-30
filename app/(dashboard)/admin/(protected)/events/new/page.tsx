import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventForm } from "@/features/admin/components/EventForm";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createEventAction } from "@/app/(dashboard)/admin/(protected)/events/actions";

export const metadata: Metadata = { title: "فعالية جديدة" };
export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <main className="admin-page">
      <PageHeader eyebrow="إدارة الفعاليات" title="فعالية جديدة" />
      <EventForm action={createEventAction} submitLabel="حفظ المسودة" />
    </main>
  );
}
