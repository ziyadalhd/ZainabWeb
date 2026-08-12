import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdmin } from "@/lib/auth/require-admin";
import { InterestedContactsTable } from "@/features/admin/components/InterestedContactsTable";
import { createAdminInterestedContactRepository } from "@/lib/supabase/interested-contacts";

export const metadata: Metadata = { title: "المهتمون" };
export const dynamic = "force-dynamic";

export default async function InterestedPage() {
  await requireAdmin();
  const repository = await createAdminInterestedContactRepository();
  const contacts = await repository.list();
  return <main className="admin-page"><PageHeader eyebrow="لوحة الإدارة" title="المهتمون" description="قائمة من وافقت على تلقي معلومات الفعاليات القادمة. الإرسال الجماعي غير مفعّل بعد." /><div className="mt-8"><InterestedContactsTable contacts={contacts} /></div></main>;
}
