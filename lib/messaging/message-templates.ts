import type { ManualMessageKind } from "@/lib/domain/types";

/**
 * Editable template kinds. Both reminder messages share one template and
 * differ only by the heading line the sender adds, so five templates cover
 * the six manual message kinds.
 */
export const messageTemplateKinds = [
  "confirmation",
  "registration_reminder",
  "waitlist_invitation",
  "cancellation",
  "feedback_request",
] as const;

export type MessageTemplateKind = (typeof messageTemplateKinds)[number];

export type MessageTemplateToken = "{{attendee_name}}" | "{{event_title}}" | "{{event_date}}" | "{{management_url}}";

export interface MessageTemplateDefinition {
  kind: MessageTemplateKind;
  label: string;
  description: string;
  /** Tokens the admin may use. */
  tokens: readonly MessageTemplateToken[];
  /** Tokens the body must keep, because dropping them breaks the message. */
  requiredTokens: readonly MessageTemplateToken[];
  defaultBody: string;
}

export const messageTemplateTokenLabels: Record<MessageTemplateToken, string> = {
  "{{attendee_name}}": "اسم المشاركة",
  "{{event_title}}": "عنوان الفعالية",
  "{{event_date}}": "تاريخ الفعالية",
  "{{management_url}}": "رابط الإدارة",
};

const confirmationDefault = `يا هلا فيكِ {{attendee_name}}، 🤍
سعدنا جداً بانضمامك معنا في فعالية «{{event_title}}»!

يسعدنا تأكيد حضورك، أو إدارته والاعتذار في حال طرأ عليك ظرف، من خلال الرابط التالي:
{{management_url}}

ولإتمام تسجيلك بكل راحة، يمكنك التحويل مسبقاً على الحساب التالي:
رقم الآيبان:
SA75 8000 0201 6080 1626 0868

(ملاحظة: يمكنك إتمام التحويل البنكي، أو الدفع مباشرة عند وصولك للمقر).

نتطلع لتواجدك بفارغ الصبر! ✨`;

const reminderDefault = `يا هلا {{attendee_name}} 🤍
متحمسين نشوفك في فعالية «{{event_title}}»!

بما أن في قائمة الانتظار مشاركات بانتظار مقعد، نتمنى تأكيد حضورك فقط إذا كنتِ متأكدة، حتى نقدر نرتب الأمور بعدل للجميع.

أكدي حضورك أو اعتذري من هنا متى ما ناسبك:
{{management_url}}

ننتظرك بكل حب! ✨`;

const waitlistInvitationDefault = `يا هلا {{attendee_name}} 🤍
عندنا خبر سعيد! توفر مقعد في فعالية «{{event_title}}» وحبينا نبدأ فيك.

الدعوة صالحة لمدة ٦ ساعات فقط، فبادري بقبولها من الرابط قبل ما تنتهي:
{{management_url}}

نتحمس نشوفك معنا! ✨`;

const cancellationDefault = `يا هلا {{attendee_name}} 🤍
نعتذر منك، أُلغيت فعالية {{event_title}} المقرر إقامتها في {{event_date}}.

نتمنى نشوفك في فعالياتنا القادمة، وراح نشاركك المواعيد الجديدة أول بأول عبر القنوات المعتمدة.

شكراً لتفهمك 🤍`;

const feedbackRequestDefault = `يا هلا {{attendee_name}} 🤍
كم سعدنا بحضورك فعالية «{{event_title}}» في نادي بَيْن الثقافي!

رأيك يهمنا كثير، ويساعدنا نطور فعالياتنا القادمة عشانك. شاركينا انطباعك من هنا:
{{management_url}}

شكراً من القلب لتواجدك معنا 🤍`;

export const messageTemplateDefinitions: Record<MessageTemplateKind, MessageTemplateDefinition> = {
  confirmation: {
    kind: "confirmation",
    label: "تأكيد التسجيل",
    description: "تُرسل بعد تسجيل المشاركة، وفيها رابط إدارة الحجز وبيانات التحويل.",
    tokens: ["{{attendee_name}}", "{{event_title}}", "{{management_url}}"],
    requiredTokens: ["{{management_url}}"],
    defaultBody: confirmationDefault,
  },
  registration_reminder: {
    kind: "registration_reminder",
    label: "التذكير قبل الفعالية",
    description: "تُستخدم لتذكير ٢٤ ساعة وتذكير ٣ ساعات معًا. يُضاف عنوان التذكير تلقائيًا في أول الرسالة.",
    tokens: ["{{attendee_name}}", "{{event_title}}", "{{management_url}}"],
    requiredTokens: ["{{attendee_name}}", "{{event_title}}", "{{management_url}}"],
    defaultBody: reminderDefault,
  },
  waitlist_invitation: {
    kind: "waitlist_invitation",
    label: "دعوة قائمة الانتظار",
    description: "تُرسل عند توفر مقعد لمشاركة في قائمة الانتظار.",
    tokens: ["{{attendee_name}}", "{{event_title}}", "{{management_url}}"],
    requiredTokens: ["{{management_url}}"],
    defaultBody: waitlistInvitationDefault,
  },
  cancellation: {
    kind: "cancellation",
    label: "إشعار الإلغاء",
    description: "تُرسل عند إلغاء الفعالية. لا تحتوي على رابط.",
    tokens: ["{{attendee_name}}", "{{event_title}}", "{{event_date}}"],
    requiredTokens: [],
    defaultBody: cancellationDefault,
  },
  feedback_request: {
    kind: "feedback_request",
    label: "طلب التقييم",
    description: "تُرسل بعد انتهاء الفعالية، وفيها رابط الاستبيان.",
    tokens: ["{{attendee_name}}", "{{event_title}}", "{{management_url}}"],
    requiredTokens: ["{{management_url}}"],
    defaultBody: feedbackRequestDefault,
  },
};

export const messageTemplateKindByMessageKind: Record<ManualMessageKind, MessageTemplateKind> = {
  confirmation: "confirmation",
  reminder_24h: "registration_reminder",
  reminder_3h: "registration_reminder",
  waitlist_invitation: "waitlist_invitation",
  cancellation: "cancellation",
  feedback_request: "feedback_request",
};

export function isMessageTemplateKind(value: string): value is MessageTemplateKind {
  return messageTemplateKinds.includes(value as MessageTemplateKind);
}

export interface MessageTemplateValues {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  managementUrl: string;
}

export function renderMessageTemplate(template: string, values: MessageTemplateValues): string {
  return template
    .replaceAll("{{attendee_name}}", values.attendeeName)
    .replaceAll("{{event_title}}", values.eventTitle)
    .replaceAll("{{event_date}}", values.eventDate)
    .replaceAll("{{management_url}}", values.managementUrl);
}

/** Returns the required tokens the body is missing, so the editor can name them. */
export function findMissingTokens(kind: MessageTemplateKind, body: string): MessageTemplateToken[] {
  return messageTemplateDefinitions[kind].requiredTokens.filter((token) => !body.includes(token));
}

/** Stored bodies keyed by template kind, as passed to the message builder. */
export type MessageTemplateBodiesInput = Partial<Record<MessageTemplateKind, string | null>>;
