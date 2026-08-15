import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { submitServiceRequestAction } from "@/app/(public)/requests/actions";
import { ServiceRequestForm } from "@/features/requests/components/ServiceRequestForm";

export const metadata: Metadata = {
  title: "حجز المساحة",
  description: "إرسال طلب حجز مساحة نادي بَيْن الثقافي لمراجعته من الإدارة.",
};

export default function SpaceBookingPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="مساحتك في بَيْن" title="حجز المساحة" description="عندك لقاء أو نشاط؟ اختاري الموعد اللي يناسبك وأرسلي التفاصيل، وبنراجع الطلب ونتواصل معك." />
      <section className="mt-7 max-w-3xl">
        <ServiceRequestForm kind="space_booking" action={submitServiceRequestAction.bind(null, "space_booking")} />
      </section>
    </main>
  );
}
