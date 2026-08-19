import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { submitServiceRequestAction } from "@/app/(public)/requests/actions";
import { ServiceRequestForm } from "@/features/requests/components/ServiceRequestForm";

export const metadata: Metadata = {
  title: "طلب تقديم ورشة",
  description: "إرسال طلب تقديم ورشة إلى نادي بَيْن الثقافي لمراجعته من الإدارة.",
};

export default function SubmitWorkshopPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="شاركي معرفتك" title="طلب تقديم ورشة" description="عندك فكرة تستحق تنشارك؟ عرفينا بالورشة ومتطلباتها، وبنراجع طلبك ونتواصل معك." />
      <section className="mt-7 max-w-3xl">
        <ServiceRequestForm kind="workshop_application" action={submitServiceRequestAction.bind(null, "workshop_application")} />
      </section>
    </main>
  );
}
