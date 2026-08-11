import type { Registration } from "@/lib/domain/types";
import { formatArabicDateTime } from "@/lib/format/date";

export type RegistrationExportScope = "current" | "previous" | "waitlist";

const registrationStatusLabels = {
  registered: "مسجل",
  waitlisted: "قائمة انتظار",
  invited: "دعوة مرسلة",
  cancelled: "ملغي",
} as const;

const attendanceStatusLabels = {
  pending: "بانتظار التأكيد",
  confirmed: "تم التأكيد",
} as const;

const paymentStatusLabels = {
  unpaid: "غير مدفوع",
  deposit_paid: "دُفعت العربون",
  paid_in_full: "مدفوع بالكامل",
} as const;

const headers = [
  "رقم المرجع",
  "المسجل",
  "العمر",
  "ولية الأمر",
  "الجوال",
  "البريد الإلكتروني",
  "الفعالية",
  "موعد الفعالية",
  "حالة التسجيل",
  "حالة الحضور",
  "حالة الدفع",
  "سعر الحجز (هللة)",
  "تاريخ التسجيل",
] as const;

function escapeCsvValue(value: string | number | null): string {
  const raw = value === null ? "" : String(value);
  const formulaSafe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${formulaSafe.replaceAll('"', '""')}"`;
}

export function isRegistrationExportScope(value: string | null): value is RegistrationExportScope {
  return value === "current" || value === "previous" || value === "waitlist";
}

export function filterRegistrationsForExport(
  registrations: readonly Registration[],
  scope: RegistrationExportScope,
  now = new Date(),
): readonly Registration[] {
  if (scope === "waitlist") {
    return registrations.filter((registration) => registration.status === "waitlisted" || registration.status === "invited");
  }

  if (scope === "current") {
    return registrations.filter((registration) => registration.status === "registered" && new Date(registration.eventStartsAt) >= now);
  }

  return registrations.filter((registration) => registration.status === "cancelled" || new Date(registration.eventStartsAt) < now);
}

export function buildRegistrationsCsv(registrations: readonly Registration[]): string {
  const rows = registrations.map((registration) => [
    registration.reference,
    registration.attendeeName,
    registration.participantAge,
    registration.guardianName,
    registration.phoneE164,
    registration.email,
    registration.eventTitle,
    formatArabicDateTime(registration.eventStartsAt),
    registrationStatusLabels[registration.status],
    registration.status === "registered" ? attendanceStatusLabels[registration.attendanceStatus] : null,
    registration.status === "registered" ? paymentStatusLabels[registration.paymentStatus] : null,
    registration.priceHalalasAtBooking,
    formatArabicDateTime(registration.createdAt),
  ].map(escapeCsvValue).join(","));

  return `\uFEFF${headers.map(escapeCsvValue).join(",")}\r\n${rows.join("\r\n")}`;
}
