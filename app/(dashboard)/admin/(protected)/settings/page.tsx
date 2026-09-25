import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { SiteSettingsForm } from "@/features/admin/components/SiteSettingsForm";
import { MfaManagementPanel } from "@/features/admin/components/MfaManagementPanel";
import { InterestedContactsTable } from "@/features/admin/components/InterestedContactsTable";
import { requireAdmin } from "@/lib/auth/require-admin";
import { messageTemplateKinds } from "@/lib/messaging/message-templates";
import { MessageTemplateEditor } from "@/features/admin/components/MessageTemplateEditor";
import { createAdminInterestedContactRepository } from "@/lib/supabase/interested-contacts";
import { listMessageTemplates } from "@/lib/supabase/message-templates";
import { createAdminSiteSettingsRepository } from "@/lib/supabase/site-settings";
import { updateSiteSettingsAction } from "@/app/(dashboard)/admin/(protected)/content/actions";

export const metadata: Metadata = { title: "الإعدادات" };
export const dynamic = "force-dynamic";

type SettingsTab = "content" | "templates" | "security" | "interested";

const tabs: ReadonlyArray<{ id: SettingsTab; label: string }> = [
  { id: "content", label: "محتوى الموقع" },
  { id: "templates", label: "قوالب الرسائل" },
  { id: "security", label: "الأمان" },
  { id: "interested", label: "المهتمات" },
];

function getTab(value: string | undefined): SettingsTab {
  return tabs.some((tab) => tab.id === value) ? (value as SettingsTab) : "content";
}

async function ContentTab() {
  const repository = await createAdminSiteSettingsRepository();
  const settings = await repository.get();
  return <SiteSettingsForm settings={settings} action={updateSiteSettingsAction} />;
}

async function TemplatesTab() {
  const bodies = await listMessageTemplates();
  return (
    <div className="max-w-3xl">
      <p className="muted-copy">
        نصوص رسائل واتساب التي ترسلينها للمشاركات. عدّلي أي نص كما تحبين؛ المتغيرات تُستبدل تلقائيًا بالقيم الحقيقية عند تجهيز كل رسالة. لتخصيص نص لفعالية
        واحدة فقط، افتحي تبويب «التواصل» داخل مساحة تلك الفعالية.
      </p>
      <div className="mt-6 grid gap-6">
        {messageTemplateKinds.map((kind) => (
          <MessageTemplateEditor key={kind} kind={kind} body={bodies[kind] ?? null} />
        ))}
      </div>
    </div>
  );
}

async function InterestedTab() {
  const repository = await createAdminInterestedContactRepository();
  const contacts = await repository.list();
  return contacts.ok ? <InterestedContactsTable contacts={contacts.data} /> : <LoadErrorNotice />;
}

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const { tab: requestedTab } = await searchParams;
  if (requestedTab === "surveys") redirect("/admin/events");
  const tab = getTab(requestedTab);
  const activeTab = tabs.find((item) => item.id === tab) ?? tabs[0];

  return (
    <main className="admin-page">
      <PageHeader eyebrow="لوحة الإدارة" title="الإعدادات" />
      <nav aria-label="أقسام الإعدادات" className="workspace-tabs mt-7">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/admin/settings?tab=${item.id}`}
            aria-current={item.id === tab ? "page" : undefined}
            className={item.id === tab ? "workspace-tab workspace-tab--active" : "workspace-tab"}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <section className="mt-7" aria-labelledby="settings-content-heading">
        <h2 id="settings-content-heading" className="sr-only">
          {activeTab.label}
        </h2>
        {tab === "content" ? <ContentTab /> : null}
        {tab === "templates" ? <TemplatesTab /> : null}
        {tab === "security" ? <MfaManagementPanel /> : null}
        {tab === "interested" ? <InterestedTab /> : null}
      </section>
    </main>
  );
}
