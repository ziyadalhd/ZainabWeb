"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmActionForm } from "@/features/admin/components/ConfirmActionForm";
import type { ActionResult } from "@/lib/data/action-result";
import type { Event, EventPublicationStatus } from "@/lib/domain/types";

export type EventStatusAction = (
  id: string,
  requestedStatus: EventPublicationStatus,
  state: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

const statusSuccessMessage: Record<EventPublicationStatus, string> = {
  draft: "تمت إعادة الفعالية إلى مسودة.",
  published: "تم نشر الفعالية.",
  archived: "تم أرشفة الفعالية.",
  cancelled: "تم إلغاء الفعالية.",
};

function DirectStatusAction({
  action,
  eventId,
  status,
  label,
  primary = false,
  onSuccess,
}: {
  action: EventStatusAction;
  eventId: string;
  status: EventPublicationStatus;
  label: string;
  primary?: boolean;
  onSuccess: () => void;
}) {
  return (
    <ActionButton
      action={action.bind(null, eventId, status)}
      label={label}
      pendingLabel="جارٍ التنفيذ…"
      className={`${primary ? "button-primary" : "button-secondary"} min-h-10 px-3 py-2 text-sm`}
      successMessage={statusSuccessMessage[status]}
      onSuccess={onSuccess}
    />
  );
}

export function EventStatusQuickActions({ event, action }: { event: Event; action: EventStatusAction }) {
  const router = useRouter();
  const onSuccess = () => router.refresh();

  if (event.publicationStatus === "cancelled") {
    return <p className="text-xs muted-copy">الإلغاء حالة نهائية.</p>;
  }

  const readyToPublish = event.endsAt !== null && event.priceHalalas !== null;

  return (
    <details className="event-quick-status">
      <summary>تغيير الحالة</summary>
      <div className="event-quick-status__panel">
        {event.publicationStatus === "draft" ? (
          <>
            {readyToPublish ? (
              <DirectStatusAction action={action} eventId={event.id} status="published" label="نشر الفعالية" primary onSuccess={onSuccess} />
            ) : (
              <div>
                <p className="text-sm font-bold">يلزم إكمال وقت النهاية والسعر قبل النشر.</p>
                <Link href={`/admin/events?event=${event.id}#event-section-settings`} className="button-secondary mt-3 min-h-10 px-3 py-2 text-sm">
                  إكمال البيانات
                </Link>
              </div>
            )}
            <ConfirmActionForm
              action={action.bind(null, event.id, "archived")}
              label="أرشفة الفعالية"
              confirmation={`هل تريدين أرشفة «${event.title}»؟ ستختفي من الموقع العام.`}
              successMessage={statusSuccessMessage.archived}
              tone="quiet"
              onSuccess={onSuccess}
            />
          </>
        ) : null}

        {event.publicationStatus === "published" ? (
          <>
            <ConfirmActionForm
              action={action.bind(null, event.id, "archived")}
              label="أرشفة الفعالية"
              confirmation={`هل تريدين أرشفة «${event.title}»؟ ستختفي من الموقع العام.`}
              successMessage={statusSuccessMessage.archived}
              tone="quiet"
              onSuccess={onSuccess}
            />
            <ConfirmActionForm
              action={action.bind(null, event.id, "cancelled")}
              label="إلغاء الفعالية"
              confirmation={`هل تريدين إلغاء «${event.title}»؟ ستتوقف التسجيلات وتبقى الفعالية محفوظة في السجل.`}
              successMessage={statusSuccessMessage.cancelled}
              onSuccess={onSuccess}
            />
          </>
        ) : null}

        {event.publicationStatus === "archived" ? (
          <DirectStatusAction action={action} eventId={event.id} status="draft" label="إعادة إلى مسودة" onSuccess={onSuccess} />
        ) : null}
      </div>
    </details>
  );
}
