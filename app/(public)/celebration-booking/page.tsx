import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { submitServiceRequestAction } from "@/app/(public)/requests/actions";
import { ServiceRequestForm } from "@/features/requests/components/ServiceRequestForm";

export const metadata: Metadata = {
  title: "حجز إقامة حفلات",
  description: "إرسال طلب إقامة حفل في نادي بَيْن الثقافي لمراجعته من الإدارة.",
};

export default function CelebrationBookingPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="مناسبتك في بَيْن" title="حجز إقامة حفلات" description="شاركي معنا تفاصيل مناسبتك والموعد اللي يناسبك، وبنراجع الطلب ونتواصل معك قبل التأكيد." />
      <section className="mt-7 max-w-3xl">
        <ServiceRequestForm kind="celebration_booking" action={submitServiceRequestAction.bind(null, "celebration_booking")} />
      </section>
    </main>
  );
}
