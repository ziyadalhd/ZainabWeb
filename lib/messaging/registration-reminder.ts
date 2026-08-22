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
  return `السلام عليكم ${attendeeName}،\nحياكِ في فعالية ${eventTitle}.\nلا تؤكدي حضورك إلا إذا كنتِ متأكدة من الحضور، لأن هناك مشاركات في قائمة الانتظار.\nيمكنك تأكيد الحضور أو الاعتذار من هنا:\n${managementUrl}`;
}

export function buildWhatsAppMessageUrl(phoneE164: string, message: string): string {
  return `https://wa.me/${phoneE164.replace(/^\+/, "")}?text=${encodeURIComponent(message)}`;
}

export function buildEventCancellationMessage(attendeeName: string, eventTitle: string, eventStartsAt: string): string {
  return `السلام عليكم ${attendeeName}،\nنعتذر، أُلغيت فعالية ${eventTitle} المقرر إقامتها في ${eventStartsAt}.\nسنشارك معكِ مواعيد الفعاليات القادمة عبر القنوات المعتمدة.`;
}
