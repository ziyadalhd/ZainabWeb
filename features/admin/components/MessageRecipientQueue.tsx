import type { ManualMessageKind, Registration } from "@/lib/domain/types";
import { formatArabicNumber } from "@/lib/format/date";

interface MessageRecipientQueueProps {
  recipients: readonly Registration[];
  selectedId: string | undefined;
  kind: ManualMessageKind;
  isSent: (registration: Registration) => boolean;
  isWaiting: (registration: Registration) => boolean;
  onSelect: (registrationId: string) => void;
}

export function MessageRecipientQueue({ recipients, selectedId, isSent, isWaiting, onSelect }: MessageRecipientQueueProps) {
  return (
    <aside className="message-recipient-queue" aria-label="قائمة المستلمات">
      <div className="message-recipient-queue__heading">
        <strong>المستلمات</strong>
        <span>{formatArabicNumber(recipients.length)}</span>
      </div>
      <div className="message-recipient-queue__items">
        {recipients.map((registration) => {
          const sent = isSent(registration);
          const waiting = !sent && isWaiting(registration);
          return (
            <button
              type="button"
              key={registration.id}
              className={selectedId === registration.id ? "message-recipient message-recipient--active" : "message-recipient"}
              onClick={() => onSelect(registration.id)}
            >
              <span>
                <strong>{registration.attendeeName}</strong>
                <small dir="ltr">{registration.phoneE164}</small>
              </span>
              <small className={sent ? "message-state message-state--sent" : waiting ? "message-state message-state--waiting" : "message-state"}>
                {sent ? "أُرسلت يدويًا" : waiting ? "بانتظار التأكيد" : "تحتاج إرسالًا"}
              </small>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
