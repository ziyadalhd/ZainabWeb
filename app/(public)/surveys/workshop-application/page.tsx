import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { submitServiceRequestAction } from "@/app/(public)/requests/actions";
import { ServiceRequestForm } from "@/features/requests/components/ServiceRequestForm";

export const metadata: Metadata = {
  title: "طلب تقديم ورشة",
  description: "إرسال طلب تقديم ورشة إلى نادي بَيْن الثقافي لمراجعته من الإدارة.",
};

export default function WorkshopApplicationPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="استبيانات" title="طلب تقديم ورشة" />
      <section className="mt-7 max-w-3xl">
        <ServiceRequestForm kind="workshop_application" action={submitServiceRequestAction.bind(null, "workshop_application")} />
      </section>
    </main>
  );
}
