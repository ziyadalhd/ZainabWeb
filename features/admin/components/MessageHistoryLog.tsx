import type { ManualMessageRecord, Registration } from "@/lib/domain/types";
import { formatArabicDateTime } from "@/lib/format/date";
import { manualMessageLabels } from "@/lib/messaging/manual-messages";

interface MessageHistoryLogProps {
  messages: readonly ManualMessageRecord[];
  registrations: readonly Registration[];
}

export function MessageHistoryLog({ messages, registrations }: MessageHistoryLogProps) {
  if (messages.length === 0) return null;

  return (
    <details className="message-history mt-6">
      <summary>سجل الرسائل لهذه الفعالية</summary>
      <ul>
        {messages.slice(0, 30).map((message) => {
          const recipient = registrations.find((registration) => registration.id === message.registrationId);
          return (
            <li key={message.id}>
              <span>
                <strong>{recipient?.attendeeName ?? "تسجيل سابق"}</strong>
                <small>{manualMessageLabels[message.kind]}</small>
              </span>
              <span>
                <strong>{message.sentAt ? "أُرسلت يدويًا" : message.supersededAt ? "استُبدل الرابط" : "جُهزت ولم تُعلّم كمرسلة"}</strong>
                <small>{formatArabicDateTime(message.sentAt ?? message.supersededAt ?? message.preparedAt)}</small>
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
