import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { submitServiceRequestAction } from "@/app/(public)/requests/actions";
import { ServiceRequestForm } from "@/features/requests/components/ServiceRequestForm";

export const metadata: Metadata = { title: "حجز إقامة حفلات" };

export default function CelebrationBookingPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="طلبات النادي" title="حجز إقامة حفلات" description="أرسلي طلبك لمراجعته من الإدارة. لا يُعد الطلب حجزًا مؤكدًا." />
      <section className="mt-7 max-w-3xl">
        <ServiceRequestForm kind="celebration_booking" action={submitServiceRequestAction.bind(null, "celebration_booking")} />
      </section>
    </main>
  );
}
