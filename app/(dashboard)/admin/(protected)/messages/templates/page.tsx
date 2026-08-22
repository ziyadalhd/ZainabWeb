import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdmin } from "@/lib/auth/require-admin";
import { registrationReminderTemplateTokens } from "@/lib/messaging/registration-reminder";
import { getRegistrationReminderTemplate } from "@/lib/supabase/message-templates";
import { saveGlobalReminderTemplateAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MessageTemplatesPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAdmin();
  const [{ success, error }, template] = await Promise.all([searchParams, getRegistrationReminderTemplate()]);
  return <main className="admin-page"><div className="flex flex-wrap items-end justify-between gap-5"><PageHeader eyebrow="التواصل" title="قوالب الرسائل" description="هذا هو النص الافتراضي لتذكير التسجيلات. تُستبدل المتغيرات تلقائيًا عند تجهيز كل رسالة." /><Link href="/admin/events" className="button-secondary">اختيار فعالية</Link></div>{success === "saved" ? <p className="notice-success mt-6">تم حفظ القالب الافتراضي.</p> : null}{error ? <p role="alert" className="notice-error mt-6">تحققي من النص ومن وجود جميع المتغيرات المطلوبة.</p> : null}<form action={saveGlobalReminderTemplateAction} className="form-surface mt-7 max-w-3xl p-5 sm:p-7"><label htmlFor="template-body" className="font-black">قالب تذكير التسجيل</label><textarea id="template-body" name="body" defaultValue={template ?? ""} rows={10} className="field-control mt-3 w-full" required /><p className="mt-3 text-sm muted-copy">المتغيرات المطلوبة: {registrationReminderTemplateTokens.join("، ")}</p><button type="submit" className="button-primary mt-5">حفظ القالب</button></form></main>;
}
