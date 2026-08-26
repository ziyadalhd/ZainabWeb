import type { Event, ManualMessageKind, ManualMessageRecord } from "@/lib/domain/types";
import { manualMessageKinds, manualMessageLabels } from "@/lib/messaging/manual-messages";

interface MessageKindTabsProps {
  event: Event;
  messages: readonly ManualMessageRecord[];
  activeKind: ManualMessageKind;
  isCategoryActionable: (event: Event, kind: ManualMessageKind, now: Date) => boolean;
  now: Date;
  onSelect: (kind: ManualMessageKind) => void;
}

export function MessageKindTabs({ event, messages, activeKind, isCategoryActionable, now, onSelect }: MessageKindTabsProps) {
  return (
    <nav className="message-kind-tabs" aria-label="أنواع الرسائل">
      {manualMessageKinds.map((messageKind) => {
        const historical = messages.some((message) => message.kind === messageKind);
        const enabled = historical || isCategoryActionable(event, messageKind, now);
        return (
          <button
            key={messageKind}
            type="button"
            disabled={!enabled}
            aria-pressed={activeKind === messageKind}
            className={activeKind === messageKind ? "message-kind-tab message-kind-tab--active" : "message-kind-tab"}
            onClick={() => onSelect(messageKind)}
          >
            {manualMessageLabels[messageKind]}
          </button>
        );
      })}
    </nav>
  );
}
