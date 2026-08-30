import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { DeleteEventButton } from "@/features/admin/components/DeleteEventButton";
import { EventForm } from "@/features/admin/components/EventForm";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { deleteEventAction, updateEventAction } from "@/app/(dashboard)/admin/(protected)/events/actions";

export const metadata: Metadata = { title: "تعديل الفعالية" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const repository = await createAdminEventRepository();
  const event = await repository.get(id);
  if (!event) notFound();

  return (
    <main className="admin-page">
      <nav aria-label="مسار التنقل" className="mb-5 text-sm font-medium muted-copy">
        <Link href="/admin/events" className="underline decoration-[var(--brand-olive)] underline-offset-4">
          الفعاليات
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/admin/events?event=${event.id}`} className="underline decoration-[var(--brand-olive)] underline-offset-4">
          {event.title}
        </Link>
        <span aria-hidden="true"> / </span>
        <span>تعديل</span>
      </nav>
      <PageHeader eyebrow="إدارة الفعاليات" title="تعديل الفعالية" />
      <EventForm action={updateEventAction.bind(null, id)} event={event} submitLabel="حفظ التعديلات" />
      <section aria-labelledby="delete-event-heading" className="card-surface mt-8 p-6">
        <h2 id="delete-event-heading" className="text-xl font-bold text-[var(--color-error-text)]">
          منطقة الحذف
        </h2>
        <p className="mt-3 muted-copy">
          الحذف نهائي ولا يمكن التراجع عنه، وهو متاح فقط لفعالية لا تسجيلات ولا تقييمات لها. للفعاليات التي بدأ التسجيل فيها،
          استخدمي الإلغاء من مساحة الفعالية.
        </p>
        <div className="mt-5">
          <DeleteEventButton
            eventId={event.id}
            eventTitle={event.title}
            attendeeCount={event.activeReservationCount}
            action={deleteEventAction}
            triggerClassName="button-danger"
          />
        </div>
      </section>
    </main>
  );
}
