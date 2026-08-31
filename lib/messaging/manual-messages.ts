import type { ManualMessageKind, ManualMessageRecordKind } from "@/lib/domain/types";
import {
  buildEventCancellationMessage,
  buildRegistrationReminderMessage,
  renderRegistrationReminderTemplate,
} from "@/lib/messaging/registration-reminder";

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
    return `يا هلا فيكِ ${attendeeName}، 🤍\nسعدنا جداً بانضمامك معنا في فعالية «${eventTitle}»!\n\nيسعدنا تأكيد حضورك، أو إدارته والاعتذار في حال طرأ عليك ظرف، من خلال الرابط التالي:\n${secureUrl}\n\nولإتمام تسجيلك بكل راحة، يمكنك التحويل مسبقاً على الحساب التالي:\nرقم الآيبان:\nSA75 8000 0201 6080 1626 0868\n\n(ملاحظة: يمكنك إتمام التحويل البنكي، أو الدفع مباشرة عند وصولك للمقر).\n\nنتطلع لتواجدك بفارغ الصبر! ✨`;
  }

  if (kind === "reminder_24h" || kind === "reminder_3h") {
    const reminder = reminderTemplate
      ? renderRegistrationReminderTemplate(reminderTemplate, {
          attendeeName,
          eventTitle,
          managementUrl: secureUrl,
        })
      : buildRegistrationReminderMessage({ attendeeName, eventTitle, managementUrl: secureUrl });
    return `${kind === "reminder_24h" ? "تذكير قبل ٢٤ ساعة" : "تذكير قبل ٣ ساعات"}\n${reminder}`;
  }

  if (kind === "waitlist_invitation") {
    return `يا هلا ${attendeeName} 🤍\nعندنا خبر سعيد! توفر مقعد في فعالية «${eventTitle}» وحبينا نبدأ فيك.\n\nالدعوة صالحة لمدة ٦ ساعات فقط، فبادري بقبولها من الرابط قبل ما تنتهي:\n${secureUrl}\n\nنتحمس نشوفك معنا! ✨`;
  }

  return `يا هلا ${attendeeName} 🤍\nكم سعدنا بحضورك فعالية «${eventTitle}» في نادي بَيْن الثقافي!\n\nرأيك يهمنا كثير، ويساعدنا نطور فعالياتنا القادمة عشانك. شاركينا انطباعك من هنا:\n${secureUrl}\n\nشكراً من القلب لتواجدك معنا 🤍`;
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
