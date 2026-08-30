"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EventForm } from "@/features/admin/components/EventForm";
import { EventPosterForm } from "@/features/admin/components/EventPosterForm";
import { EventPublicationActions } from "@/features/admin/components/EventPublicationActions";
import { DeleteEventButton } from "@/features/admin/components/DeleteEventButton";
import type { EventStatusAction } from "@/features/admin/components/EventStatusQuickActions";
import type { Event } from "@/lib/domain/types";
import { deleteEventAction, updateEventAction, uploadEventPosterAction } from "@/app/(dashboard)/admin/(protected)/events/actions";

export function EventSettingsSection({ event, statusAction }: { event: Event; statusAction: EventStatusAction }) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  if (editing) {
    return (
      <div className="grid gap-3">
        <button type="button" className="button-quiet w-fit" onClick={() => setEditing(false)}>
          ← العودة إلى ملخص الفعالية
        </button>
        <EventForm
          action={updateEventAction.bind(null, event.id)}
          event={event}
          submitLabel="حفظ التعديلات"
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
        <EventPosterForm eventTitle={event.title} posterUrl={event.posterUrl} action={uploadEventPosterAction.bind(null, event.id)} />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="card-surface p-6">
        <h3 className="text-xl font-bold">إعدادات الفعالية</h3>
        <p className="mt-3 muted-copy">عدّلي المحتوى والموعد والسعة وحالة التسجيل.</p>
        <button type="button" className="button-primary mt-5" onClick={() => setEditing(true)}>
          تعديل الإعدادات
        </button>
      </div>
      <div className="card-surface p-6">
        <h3 className="text-xl font-bold">حالة النشر</h3>
        <EventPublicationActions event={event} action={statusAction} />
      </div>
      <div className="card-surface p-6">
        <h3 className="text-xl font-bold text-[var(--color-error-text)]">منطقة الحذف</h3>
        <p className="mt-3 muted-copy">
          الحذف نهائي ولا يمكن التراجع عنه، وهو متاح فقط لفعالية لا تسجيلات ولا تقييمات لها. للفعاليات التي بدأ التسجيل فيها،
          استخدمي الإلغاء من حالة النشر أعلاه.
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
      </div>
    </div>
  );
}
