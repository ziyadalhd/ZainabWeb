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
  return `السلام عليكم ${attendeeName}،\nحياكِ في فعالية ${eventTitle}.\nلا تؤكدي حضورك إلا إذا كنتِ متأكدة من الحضور، لأن هناك مشاركات في قائمة الانتظار.\nيمكنك تأكيد الحضور أو الاعتذار من هنا:\n${managementUrl}`;
}

export function buildWhatsAppMessageUrl(phoneE164: string, message: string): string {
  return `https://wa.me/${phoneE164.replace(/^\+/, "")}?text=${encodeURIComponent(message)}`;
}
