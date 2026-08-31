import type { RegistrationStatus } from "@/lib/domain/types";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

interface RegistrationAlertInput {
  attendeeName: string;
  eventTitle: string;
}

export async function notifyNewRegistration({
  attendeeName,
  eventTitle,
  status,
}: RegistrationAlertInput & { status: RegistrationStatus }): Promise<void> {
  const statusLabel = status === "waitlisted" ? "قائمة انتظار" : "مؤكد";
  await sendTelegramMessage(
    `🔔 تسجيل جديد\nالاسم: ${attendeeName}\nالفعالية: ${eventTitle}\nالحالة: ${statusLabel}`,
  );
}

export async function notifyAttendanceConfirmed({
  attendeeName,
  eventTitle,
}: RegistrationAlertInput): Promise<void> {
  await sendTelegramMessage(`✅ تأكيد حضور\n${attendeeName} أكّدت حضورها لفعالية ${eventTitle}`);
}

export async function notifyRegistrationCancelled({
  attendeeName,
  eventTitle,
}: RegistrationAlertInput): Promise<void> {
  await sendTelegramMessage(`❌ إلغاء تسجيل\n${attendeeName} ألغت تسجيلها في فعالية ${eventTitle}`);
}
