import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPublicSiteSettings } from "@/lib/supabase/site-settings";

export const metadata: Metadata = {
  title: "الشريك الأدبي",
  description: "المحتوى المعتمد للشريك الأدبي في نادي بَيْن الثقافي.",
};

export default async function LiteraryPartnerPage() {
  const settings = await getPublicSiteSettings();
  if (!settings.literaryPartnerBody) {
    return <main className="page-shell section-space"><PageHeader eyebrow="نادي بَيْن الثقافي" title="الشريك الأدبي" /><EmptyState title="قريبًا نشاركك التفاصيل" description="ارجعي لنا قريب للتعرّف على الشريك الأدبي." /></main>;
  }
  return <main className="page-shell section-space"><PageHeader eyebrow="نادي بَيْن الثقافي" title={settings.literaryPartnerTitle ?? "الشريك الأدبي"} /><article className="card-surface mt-10 max-w-3xl whitespace-pre-wrap p-6 text-lg leading-8 sm:p-8">{settings.literaryPartnerBody}</article></main>;
}
