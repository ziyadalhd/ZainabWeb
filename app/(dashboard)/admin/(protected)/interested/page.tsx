import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdmin } from "@/lib/auth/require-admin";
import { InterestedContactsTable } from "@/features/admin/components/InterestedContactsTable";
import { createAdminInterestedContactRepository } from "@/lib/supabase/interested-contacts";

export const metadata: Metadata = { title: "المهتمات" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InterestedPage() {
  await requireAdmin();
  const repository = await createAdminInterestedContactRepository();
  const contacts = await repository.list();
  return <main className="admin-page"><PageHeader eyebrow="لوحة الإدارة" title="المهتمات" description="بيانات من وافقن على استقبال أخبار الفعاليات القادمة، مع حالة الموافقة لكل واحدة." /><div className="mt-8"><InterestedContactsTable contacts={contacts} /></div></main>;
}
