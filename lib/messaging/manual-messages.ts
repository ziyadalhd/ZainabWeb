import type { ManualMessageKind, ManualMessageRecordKind } from "@/lib/domain/types";
import {
  messageTemplateDefinitions,
  messageTemplateKindByMessageKind,
  renderMessageTemplate,
  type MessageTemplateBodiesInput,
} from "@/lib/messaging/message-templates";

export const manualMessageKinds = [
  "confirmation",
  "reminder_24h",
  "reminder_3h",
  "waitlist_invitation",
  "cancellation",
  "feedback_request",
] as const satisfies readonly ManualMessageKind[];

export const manualMessageLabels: Record<ManualMessageRecordKind, string> = {
  confirmation: "تأكيد التسجيل",
  reminder_24h: "تذكير ٢٤ ساعة",
  reminder_3h: "تذكير ٣ ساعات",
  waitlist_invitation: "دعوة قائمة الانتظار",
  cancellation: "إشعار الإلغاء",
  feedback_request: "طلب التقييم",
  legacy_reminder: "تذكير سابق",
};

export function isManualMessageKind(value: string): value is ManualMessageKind {
  return manualMessageKinds.includes(value as ManualMessageKind);
}

export function manualMessageNeedsSecurePath(kind: ManualMessageKind): boolean {
  return kind !== "cancellation";
}

interface ManualMessageContentInput {
  kind: ManualMessageKind;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  secureUrl: string | null;
  /** Stored bodies for this event, already merged over the global defaults. */
  templates?: MessageTemplateBodiesInput;
}

export function buildManualMessageContent({
  kind,
  attendeeName,
  eventTitle,
  eventDate,
  secureUrl,
  templates,
}: ManualMessageContentInput): string {
  if (kind !== "cancellation" && !secureUrl) throw new Error("manual_message_secure_url_required");

  const templateKind = messageTemplateKindByMessageKind[kind];
  const body = templates?.[templateKind]?.trim() || messageTemplateDefinitions[templateKind].defaultBody;
  const rendered = renderMessageTemplate(body, {
    attendeeName,
    eventTitle,
    eventDate,
    managementUrl: secureUrl ?? "",
  });

  if (kind === "reminder_24h") return `تذكير قبل ٢٤ ساعة\n${rendered}`;
  if (kind === "reminder_3h") return `تذكير قبل ٣ ساعات\n${rendered}`;
  return rendered;
}

export function getDefaultManualMessageKind(input: {
  publicationStatus: string;
  eventEndsAt: string | null;
  eventStartsAt: string;
  now: Date;
}): ManualMessageKind {
  if (input.publicationStatus === "cancelled") return "cancellation";
  const eventEnd = new Date(input.eventEndsAt ?? input.eventStartsAt);
  if (eventEnd <= input.now) return "feedback_request";
  return "confirmation";
}
