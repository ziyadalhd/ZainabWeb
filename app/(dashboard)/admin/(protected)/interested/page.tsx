import type { Metadata } from "next";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdmin } from "@/lib/auth/require-admin";
import { InterestedContactsTable } from "@/features/admin/components/InterestedContactsTable";
import { createAdminInterestedContactRepository } from "@/lib/supabase/interested-contacts";

export const metadata: Metadata = { title: "جهات الاتصال" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InterestedPage() {
  await requireAdmin();
  const repository = await createAdminInterestedContactRepository();
  const contacts = await repository.list();
  return (
    <main className="admin-page">
      <PageHeader eyebrow="التواصل" title="المهتمات" description="قائمة من سجلن اهتمامهن بأخبار الفعاليات. افتحي واتساب أو البريد مباشرة من بيانات كل واحدة للتواصل." />
      {contacts.ok
        ? <div className="mt-8"><InterestedContactsTable contacts={contacts.data} /></div>
        : <LoadErrorNotice />}
    </main>
  );
}
