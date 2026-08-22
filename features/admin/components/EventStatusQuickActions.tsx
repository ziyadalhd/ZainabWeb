import Link from "next/link";
import { ConfirmActionForm } from "@/features/admin/components/ConfirmActionForm";
import type { Event, EventPublicationStatus } from "@/lib/domain/types";

export type EventStatusAction = (
  id: string,
  requestedStatus: EventPublicationStatus,
) => Promise<void>;

function DirectStatusAction({
  action,
  eventId,
  status,
  label,
  primary = false,
}: {
  action: EventStatusAction;
  eventId: string;
  status: EventPublicationStatus;
  label: string;
  primary?: boolean;
}) {
  return (
    <form action={action.bind(null, eventId, status)}>
      <button
        type="submit"
        className={`${primary ? "button-primary" : "button-secondary"} min-h-10 px-3 py-2 text-sm`}
      >
        {label}
      </button>
    </form>
  );
}

export function EventStatusQuickActions({
  event,
  action,
}: {
  event: Event;
  action: EventStatusAction;
}) {
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
              <DirectStatusAction
                action={action}
                eventId={event.id}
                status="published"
                label="نشر الفعالية"
                primary
              />
            ) : (
              <div>
                <p className="text-sm font-bold">يلزم إكمال وقت النهاية والسعر قبل النشر.</p>
                <Link href={`/admin/events/${event.id}/edit`} className="button-secondary mt-3 min-h-10 px-3 py-2 text-sm">
                  إكمال البيانات
                </Link>
              </div>
            )}
            <ConfirmActionForm
              action={action.bind(null, event.id, "archived")}
              label="أرشفة الفعالية"
              confirmation={`هل تريدين أرشفة «${event.title}»؟ ستختفي من الموقع العام.`}
              tone="quiet"
            />
          </>
        ) : null}

        {event.publicationStatus === "published" ? (
          <>
            <ConfirmActionForm
              action={action.bind(null, event.id, "archived")}
              label="أرشفة الفعالية"
              confirmation={`هل تريدين أرشفة «${event.title}»؟ ستختفي من الموقع العام.`}
              tone="quiet"
            />
            <ConfirmActionForm
              action={action.bind(null, event.id, "cancelled")}
              label="إلغاء الفعالية"
              confirmation={`هل تريدين إلغاء «${event.title}»؟ ستتوقف التسجيلات وتبقى الفعالية محفوظة في السجل.`}
            />
          </>
        ) : null}

        {event.publicationStatus === "archived" ? (
          <DirectStatusAction
            action={action}
            eventId={event.id}
            status="draft"
            label="إعادة إلى مسودة"
          />
        ) : null}
      </div>
    </details>
  );
}
