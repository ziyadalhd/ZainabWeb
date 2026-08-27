"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmActionForm } from "@/features/admin/components/ConfirmActionForm";
import type { EventStatusAction } from "@/features/admin/components/EventStatusQuickActions";
import type { Event } from "@/lib/domain/types";

export function EventPublicationActions({ event, action }: { event: Event; action: EventStatusAction }) {
  const router = useRouter();
  const onSuccess = () => router.refresh();
  const readyToPublish = event.endsAt !== null && event.priceHalalas !== null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {event.publicationStatus === "draft" && readyToPublish ? (
        <ActionButton
          action={action.bind(null, event.id, "published")}
          label="نشر الفعالية"
          pendingLabel="جارٍ النشر…"
          className="button-primary"
          successMessage="تم نشر الفعالية."
          onSuccess={onSuccess}
        />
      ) : null}
      {event.publicationStatus !== "archived" ? (
        <ConfirmActionForm
          action={action.bind(null, event.id, "archived")}
          label="أرشفة الفعالية"
          confirmation={`هل تريدين أرشفة «${event.title}»؟ ستختفي من الموقع العام.`}
          successMessage="تم أرشفة الفعالية."
          tone="quiet"
          onSuccess={onSuccess}
        />
      ) : (
        <ActionButton
          action={action.bind(null, event.id, "draft")}
          label="إعادة إلى مسودة"
          pendingLabel="جارٍ الحفظ…"
          className="button-secondary"
          successMessage="تمت إعادة الفعالية إلى مسودة."
          onSuccess={onSuccess}
        />
      )}
      {event.publicationStatus === "published" ? (
        <ConfirmActionForm
          action={action.bind(null, event.id, "cancelled")}
          label="إلغاء الفعالية"
          confirmation={`هل تريدين إلغاء «${event.title}»؟ ستتوقف التسجيلات وتبقى الفعالية محفوظة في السجل.`}
          successMessage="تم إلغاء الفعالية."
          onSuccess={onSuccess}
        />
      ) : null}
    </div>
  );
}
