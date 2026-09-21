export function buildWhatsAppMessageUrl(phoneE164: string, message: string): string {
  return `https://wa.me/${phoneE164.replace(/^\+/, "")}?text=${encodeURIComponent(message)}`;
}
