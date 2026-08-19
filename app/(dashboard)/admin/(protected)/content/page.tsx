import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { SiteSettingsForm } from "@/features/admin/components/SiteSettingsForm";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminSiteSettingsRepository } from "@/lib/supabase/site-settings";
import { updateSiteSettingsAction } from "@/app/(dashboard)/admin/(protected)/content/actions";

export const metadata: Metadata = { title: "محتوى الموقع" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContentPage() {
  await requireAdmin();
  const repository = await createAdminSiteSettingsRepository();
  const settings = await repository.get();
  return <main className="admin-page"><PageHeader eyebrow="لوحة الإدارة" title="محتوى الموقع" description="حدّثي النصوص والمقر والتواصل والشريك الأدبي. الروابط الاجتماعية لا تظهر للعامة إلا بعد حفظ رابط حقيقي." /><SiteSettingsForm settings={settings} action={updateSiteSettingsAction} /></main>;
}
