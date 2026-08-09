import type { Registration } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatArabicDateTime } from "@/lib/format/date";
import {
  cancelRegistrationAction,
  cancelWaitlistedRegistrationAction,
  confirmAttendanceAction,
  inviteRegistrationAction,
  revokeInvitationAction,
} from "@/app/(dashboard)/admin/(protected)/registrations/actions";
import { WaitlistInviteButton } from "@/features/admin/components/WaitlistInviteButton";

interface RegistrationTableProps {
  registrations: readonly Registration[];
  mode: "current" | "waitlist" | "previous";
}

function whatsappHref(registration: Registration): string {
  const phone = registration.phoneE164.replace("+", "");
  const message = registration.status === "waitlisted"
    ? `السلام عليكم ${registration.attendeeName}، أنت حاليًا على قائمة الانتظار لفعالية ${registration.eventTitle}. سنتواصل معك عند توفر مقعد.`
    : `السلام عليكم ${registration.attendeeName}، نذكّرك بتسجيلك في فعالية ${registration.eventTitle}. فضلاً أكد حضورك أو اعتذر بالرد على هذه الرسالة.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function RegistrationTable({ registrations, mode }: RegistrationTableProps) {
  if (registrations.length === 0) {
    return <EmptyState title="لا توجد سجلات في هذه القائمة" description="ستظهر السجلات هنا عند وصول تسجيلات مطابقة." />;
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full min-w-[72rem] border-collapse text-right text-sm">
        <caption className="sr-only">سجلات التسجيل ووسائل التواصل والإجراءات</caption>
        <thead className="bg-[var(--surface-soft)] text-[var(--brand-green-deep)]">
          <tr>
            <th className="px-5 py-4">المسجل</th>
            <th className="px-5 py-4">الفعالية</th>
            <th className="px-5 py-4">الجوال</th>
            <th className="px-5 py-4">البريد</th>
            <th className="px-5 py-4">الحالة</th>
            <th className="px-5 py-4">رقم المرجع</th>
            {mode !== "previous" ? <th className="px-5 py-4">الإجراءات</th> : null}
          </tr>
        </thead>
        <tbody>
          {registrations.map((registration) => (
            <tr key={registration.id} className="border-t border-[var(--border)] align-top">
              <td className="px-5 py-4">
                <span className="block font-bold">{registration.attendeeName}</span>
                {registration.participantAge !== null ? <span className="block text-xs muted-copy">العمر: {registration.participantAge} — ولية الأمر: {registration.guardianName}</span> : null}
              </td>
              <td className="px-5 py-4"><span className="block font-bold">{registration.eventTitle}</span><span className="text-xs muted-copy">{formatArabicDateTime(registration.eventStartsAt)}</span></td>
              <td className="px-5 py-4" dir="ltr">{registration.phoneE164}</td>
              <td className="px-5 py-4" dir="ltr">{registration.email ?? "—"}</td>
              <td className="px-5 py-4"><div className="grid justify-items-start gap-2"><StatusBadge status={registration.status} />{registration.status === "registered" ? <StatusBadge status={registration.attendanceStatus} /> : null}</div></td>
              <td className="px-5 py-4 text-xs" dir="ltr">{registration.reference}</td>
              {mode !== "previous" ? (
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <a href={whatsappHref(registration)} target="_blank" rel="noreferrer" className="rounded-xl bg-[#1f7a3f] px-3 py-2 font-bold text-white">فتح WhatsApp</a>
                    {mode === "current" && registration.attendanceStatus === "pending" ? <form action={confirmAttendanceAction.bind(null, registration.id)}><button type="submit" className="rounded-xl border border-[var(--brand-green)] px-3 py-2 font-bold text-[var(--brand-green)]">تأكيد الحضور</button></form> : null}
                    {mode === "waitlist" && registration.status === "waitlisted" ? (
                      <WaitlistInviteButton
                        attendeeName={registration.attendeeName}
                        eventTitle={registration.eventTitle}
                        action={inviteRegistrationAction.bind(null, registration.id)}
                      />
                    ) : null}
                    {mode === "waitlist" && registration.status === "invited" ? (
                      <form action={revokeInvitationAction.bind(null, registration.id)}><button type="submit" className="rounded-xl border border-[var(--color-error-text)] px-3 py-2 font-bold text-[var(--color-error-text)]">سحب الدعوة</button></form>
                    ) : null}
                    <form action={(mode === "waitlist" ? cancelWaitlistedRegistrationAction : cancelRegistrationAction).bind(null, registration.id)}><button type="submit" className="rounded-xl border border-[var(--color-error-text)] px-3 py-2 font-bold text-[var(--color-error-text)]">إلغاء</button></form>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
