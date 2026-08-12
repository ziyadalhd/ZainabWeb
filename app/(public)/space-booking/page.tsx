import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { submitServiceRequestAction } from "@/app/(public)/requests/actions";
import { ServiceRequestForm } from "@/features/requests/components/ServiceRequestForm";

export const metadata: Metadata = { title: "حجز المساحة" };

export default function SpaceBookingPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="طلبات النادي" title="حجز المساحة" description="أرسلي طلبك لمراجعته من الإدارة. لا يُعد الطلب حجزًا مؤكدًا." />
      <section className="mt-7 max-w-3xl">
        <ServiceRequestForm kind="space_booking" action={submitServiceRequestAction.bind(null, "space_booking")} />
      </section>
    </main>
  );
}
