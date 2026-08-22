import type { ManualMessageKind, ManualMessageRecordKind } from "@/lib/domain/types";
import { buildEventCancellationMessage, renderRegistrationReminderTemplate } from "@/lib/messaging/registration-reminder";

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
  reminderTemplate?: string | null;
}

export function buildManualMessageContent({
  kind,
  attendeeName,
  eventTitle,
  eventDate,
  secureUrl,
  reminderTemplate,
}: ManualMessageContentInput): string {
  if (kind === "cancellation") {
    return buildEventCancellationMessage(attendeeName, eventTitle, eventDate);
  }

  if (!secureUrl) throw new Error("manual_message_secure_url_required");

  if (kind === "confirmation") {
    return `السلام عليكم ${attendeeName}،\nتم تسجيلك في فعالية «${eventTitle}».\nيمكنك تأكيد الحضور أو الاعتذار وإدارة تسجيلك من الرابط الآمن:\n${secureUrl}`;
  }

  if (kind === "reminder_24h" || kind === "reminder_3h") {
    const reminder = reminderTemplate
      ? renderRegistrationReminderTemplate(reminderTemplate, {
          attendeeName,
          eventTitle,
          managementUrl: secureUrl,
        })
      : `السلام عليكم ${attendeeName}،\nحياكِ في فعالية ${eventTitle}.\nلا تؤكدي حضورك إلا إذا كنتِ متأكدة من الحضور، لأن هناك مشاركات في قائمة الانتظار.\nيمكنك تأكيد الحضور أو الاعتذار من هنا:\n${secureUrl}`;
    return `${kind === "reminder_24h" ? "تذكير قبل ٢٤ ساعة" : "تذكير قبل ٣ ساعات"}\n${reminder}`;
  }

  if (kind === "waitlist_invitation") {
    return `السلام عليكم ${attendeeName}، توفر مقعد في فعالية ${eventTitle}. الدعوة صالحة لمدة ٦ ساعات، ويمكن قبولها من الرابط: ${secureUrl}`;
  }

  return `السلام عليكم ${attendeeName}، نشكركِ على حضور فعالية «${eventTitle}» في نادي بَيْن الثقافي. يهمنا رأيكِ لتطوير تجاربنا القادمة عبر هذا الرابط: ${secureUrl}`;
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
