export function toSaudiWhatsAppUrl(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (/^05\d{8}$/.test(digits)) return `https://wa.me/966${digits.slice(1)}`;
  if (/^9665\d{8}$/.test(digits)) return `https://wa.me/${digits}`;
  return null;
}
