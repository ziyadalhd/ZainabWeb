interface RegistrationReminderMessageInput {
  attendeeName: string;
  eventTitle: string;
  managementUrl: string;
}

export const registrationReminderTemplateTokens = ["{{attendee_name}}", "{{event_title}}", "{{management_url}}"] as const;

export function renderRegistrationReminderTemplate(template: string, { attendeeName, eventTitle, managementUrl }: RegistrationReminderMessageInput): string {
  return template
    .replaceAll("{{attendee_name}}", attendeeName)
    .replaceAll("{{event_title}}", eventTitle)
    .replaceAll("{{management_url}}", managementUrl);
}

export function buildRegistrationReminderMessage({
  attendeeName,
  eventTitle,
  managementUrl,
}: RegistrationReminderMessageInput): string {
  return `يا هلا ${attendeeName} 🤍\nمتحمسين نشوفك في فعالية «${eventTitle}»!\n\nبما أن هناك مشاركات بانتظار مقعد في قائمة الانتظار، نتمنى تأكيد حضورك فقط إذا كنتِ متأكدة، حتى نقدر نرتب الأمور بعدل للجميع.\n\nأكدي حضورك أو اعتذري من هنا متى ما ناسبك:\n${managementUrl}\n\nننتظرك بكل حب! ✨`;
}

export function buildWhatsAppMessageUrl(phoneE164: string, message: string): string {
  return `https://wa.me/${phoneE164.replace(/^\+/, "")}?text=${encodeURIComponent(message)}`;
}

export function buildEventCancellationMessage(attendeeName: string, eventTitle: string, eventStartsAt: string): string {
  return `يا هلا ${attendeeName} 🤍\nنعتذر منك، تم إلغاء فعالية ${eventTitle} المقرر إقامتها في ${eventStartsAt}.\n\nنتمنى نشوفك في فعالياتنا القادمة، وراح نشاركك المواعيد الجديدة أول بأول عبر القنوات المعتمدة.\n\nشكراً لتفهمك 🤍`;
}
