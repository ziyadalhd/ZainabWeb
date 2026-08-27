import type { Metadata } from "next";
import Link from "next/link";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { SiteSettingsForm } from "@/features/admin/components/SiteSettingsForm";
import { MfaManagementPanel } from "@/features/admin/components/MfaManagementPanel";
import { InterestedContactsTable } from "@/features/admin/components/InterestedContactsTable";
import { AdminEventFeedbackTable } from "@/features/surveys/components/AdminEventFeedbackTable";
import { requireAdmin } from "@/lib/auth/require-admin";
import { registrationReminderTemplateTokens } from "@/lib/messaging/registration-reminder";
import { createAdminEventFeedbackRepository } from "@/lib/supabase/event-feedback";
import { createAdminInterestedContactRepository } from "@/lib/supabase/interested-contacts";
import { getRegistrationReminderTemplate } from "@/lib/supabase/message-templates";
import { createAdminSiteSettingsRepository } from "@/lib/supabase/site-settings";
import { updateSiteSettingsAction } from "@/app/(dashboard)/admin/(protected)/content/actions";
import { saveGlobalReminderTemplateAction } from "@/app/(dashboard)/admin/(protected)/messages/templates/actions";

export const metadata: Metadata = { title: "الإعدادات" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SettingsTab = "content" | "templates" | "security" | "interested" | "surveys";

const tabs: ReadonlyArray<{ id: SettingsTab; label: string }> = [
  { id: "content", label: "محتوى الموقع" },
  { id: "templates", label: "قوالب الرسائل" },
  { id: "security", label: "الأمان" },
  { id: "interested", label: "المهتمات" },
  { id: "surveys", label: "الاستبيانات" },
];

function getTab(value: string | undefined): SettingsTab {
  return tabs.some((tab) => tab.id === value) ? (value as SettingsTab) : "content";
}

async function ContentTab() {
  const repository = await createAdminSiteSettingsRepository();
  const settings = await repository.get();
  return <SiteSettingsForm settings={settings} action={updateSiteSettingsAction} />;
}

async function TemplatesTab({ success, error }: { success?: string; error?: string }) {
  const template = await getRegistrationReminderTemplate();
  return (
    <div className="max-w-3xl">
      <p className="muted-copy">
        هذا هو النص الافتراضي لتذكير التسجيلات. تُستبدل المتغيرات تلقائيًا عند تجهيز كل رسالة. لتخصيص القالب لفعالية معينة، افتحي تبويب «التواصل» داخل مساحة تلك
        الفعالية.
      </p>
      {success === "saved" ? (
        <p role="status" className="notice-success mt-4">
          تم حفظ القالب الافتراضي.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="notice-error mt-4">
          تحققي من النص ومن وجود جميع المتغيرات المطلوبة.
        </p>
      ) : null}
      <form action={saveGlobalReminderTemplateAction} className="form-surface mt-5 p-5 sm:p-7">
        <label htmlFor="template-body" className="font-black">
          قالب تذكير التسجيل
        </label>
        <textarea id="template-body" name="body" defaultValue={template ?? ""} rows={10} className="field-control mt-3 w-full" required />
        <p className="mt-3 text-sm muted-copy">المتغيرات المطلوبة: {registrationReminderTemplateTokens.join("، ")}</p>
        <button type="submit" className="button-primary mt-5">
          حفظ القالب
        </button>
      </form>
    </div>
  );
}

async function InterestedTab() {
  const repository = await createAdminInterestedContactRepository();
  const contacts = await repository.list();
  return contacts.ok ? <InterestedContactsTable contacts={contacts.data} /> : <LoadErrorNotice />;
}

async function SurveysTab() {
  const repository = await createAdminEventFeedbackRepository();
  const responses = await repository.listSubmitted();
  return responses.ok ? <AdminEventFeedbackTable responses={responses.data} /> : <LoadErrorNotice />;
}

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string; success?: string; error?: string }> }) {
  await requireAdmin();
  const { tab: requestedTab, success, error } = await searchParams;
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
        {tab === "templates" ? <TemplatesTab success={success} error={error} /> : null}
        {tab === "security" ? <MfaManagementPanel /> : null}
        {tab === "interested" ? <InterestedTab /> : null}
        {tab === "surveys" ? <SurveysTab /> : null}
      </section>
    </main>
  );
}
