"use client";

import { messageTemplateKinds, type MessageTemplateBodiesInput } from "@/lib/messaging/message-templates";
import { MessageTemplateEditor } from "@/features/admin/components/MessageTemplateEditor";

interface EventMessageTemplatesProps {
  eventId: string;
  /** Bodies saved for this event only; absent kinds use the global text. */
  eventTemplates: MessageTemplateBodiesInput;
  /** Bodies saved globally, offered as the fallback to copy from. */
  globalTemplates: MessageTemplateBodiesInput;
}

export function EventMessageTemplates({ eventId, eventTemplates, globalTemplates }: EventMessageTemplatesProps) {
  const overriddenCount = messageTemplateKinds.filter((kind) => eventTemplates[kind]).length;

  return (
    <details className="message-history max-w-3xl">
      <summary>تخصيص نصوص الرسائل لهذه الفعالية{overriddenCount > 0 ? ` (${overriddenCount} مخصص)` : ""}</summary>
      <div className="border-t border-[var(--color-border)] p-6">
        <p className="muted-copy">
          أي نص تحفظينه هنا يُستخدم لهذه الفعالية وحدها. النصوص التي لا تعدّلينها تبقى على النص العام من الإعدادات.
        </p>
        <div className="mt-5 grid gap-6">
          {messageTemplateKinds.map((kind) => (
            <MessageTemplateEditor
              key={kind}
              kind={kind}
              body={eventTemplates[kind] ?? null}
              eventId={eventId}
              globalBody={globalTemplates[kind] ?? null}
            />
          ))}
        </div>
      </div>
    </details>
  );
}
