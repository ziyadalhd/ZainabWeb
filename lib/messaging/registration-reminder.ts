interface RegistrationReminderMessageInput {
  attendeeName: string;
  eventTitle: string;
  managementUrl: string;
}

export function buildRegistrationReminderMessage({
  attendeeName,
  eventTitle,
  managementUrl,
}: RegistrationReminderMessageInput): string {
  return `السلام عليكم ${attendeeName}،\nحياكِ في فعالية ${eventTitle}.\nنأمل تأكيد حضورك أو الاعتذار من الرابط الآمن الخاص بك:\n${managementUrl}`;
}

export function buildWhatsAppMessageUrl(phoneE164: string, message: string): string {
  return `https://wa.me/${phoneE164.replace(/^\+/, "")}?text=${encodeURIComponent(message)}`;
}
