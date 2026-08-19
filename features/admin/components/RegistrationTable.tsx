import type { Registration } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatArabicDateTime, formatArabicNumber } from "@/lib/format/date";
import {
  cancelRegistrationAction,
  cancelWaitlistedRegistrationAction,
  confirmAttendanceAction,
  inviteRegistrationAction,
  markRegistrationReminderSentAction,
  prepareRegistrationReminderAction,
  prepareEventFeedbackLinkAction,
  recordCheckInAction,
  revokeInvitationAction,
  setRegistrationPaymentStatusAction,
} from "@/app/(dashboard)/admin/(protected)/registrations/actions";
import { WaitlistInviteButton } from "@/features/admin/components/WaitlistInviteButton";
import { RegistrationReminderButton } from "@/features/admin/components/RegistrationReminderButton";
import { RegistrationFeedbackButton } from "@/features/admin/components/RegistrationFeedbackButton";
import { RegistrationPaymentStatusForm } from "@/features/admin/components/RegistrationPaymentStatusForm";
import { ConfirmActionForm } from "@/features/admin/components/ConfirmActionForm";

interface RegistrationTableProps {
  registrations: readonly Registration[];
  mode: "current" | "waitlist" | "previous";
}

function waitlistWhatsappHref(registration: Registration): string {
  const phone = registration.phoneE164.replace("+", "");
  const message = registration.status === "waitlisted"
    ? `السلام عليكم ${registration.attendeeName}، أنت حاليًا على قائمة الانتظار لفعالية ${registration.eventTitle}. سنتواصل معك عند توفر مقعد.`
    : `السلام عليكم ${registration.attendeeName}، حياكِ في فعالية ${registration.eventTitle}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function RegistrationActions({ registration, mode }: { registration: Registration; mode: RegistrationTableProps["mode"] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {mode === "previous" && registration.status === "registered" ? (
        <RegistrationFeedbackButton
          attendeeName={registration.attendeeName}
          eventTitle={registration.eventTitle}
          phoneE164={registration.phoneE164}
          action={prepareEventFeedbackLinkAction.bind(null, registration.id)}
        />
      ) : null}
      {mode === "current" ? (
        <RegistrationReminderButton
          attendeeName={registration.attendeeName}
          eventTitle={registration.eventTitle}
          phoneE164={registration.phoneE164}
          latestPreparedAt={registration.latestReminderPreparedAt}
          latestSentAt={registration.latestReminderSentAt}
          prepareAction={prepareRegistrationReminderAction.bind(null, registration.id)}
          markSentAction={markRegistrationReminderSentAction}
        />
      ) : (
        <a href={waitlistWhatsappHref(registration)} target="_blank" rel="noreferrer" className="button-primary min-h-10 px-3 py-2 text-sm">فتح WhatsApp</a>
      )}
      {mode === "current" && registration.attendanceStatus === "pending" ? <form action={confirmAttendanceAction.bind(null, registration.id)}><button type="submit" className="button-secondary min-h-10 px-3 py-2 text-sm">تأكيد الحضور</button></form> : null}
      {mode === "current" && registration.checkInStatus !== "checked_in" ? <form action={recordCheckInAction.bind(null, registration.id, "checked_in")}><button type="submit" className="button-secondary min-h-10 px-3 py-2 text-sm">تسجيل الحضور</button></form> : null}
      {mode === "current" && registration.checkInStatus !== "absent" ? (
        <ConfirmActionForm
          action={recordCheckInAction.bind(null, registration.id, "absent")}
          label="تسجيل الغياب"
          confirmation={`هل أنت متأكدة أن ${registration.attendeeName} لم تحضر الفعالية؟`}
        />
      ) : null}
      {mode === "waitlist" && registration.status === "waitlisted" ? (
        <WaitlistInviteButton
          attendeeName={registration.attendeeName}
          eventTitle={registration.eventTitle}
          action={inviteRegistrationAction.bind(null, registration.id)}
        />
      ) : null}
      {mode === "waitlist" && registration.status === "invited" ? (
        <ConfirmActionForm
          action={revokeInvitationAction.bind(null, registration.id)}
          label="سحب الدعوة"
          confirmation={`هل تريدين سحب دعوة ${registration.attendeeName} وإعادتها لقائمة الانتظار؟`}
        />
      ) : null}
      <ConfirmActionForm
        action={(mode === "waitlist" ? cancelWaitlistedRegistrationAction : cancelRegistrationAction).bind(null, registration.id)}
        label="إلغاء التسجيل"
        confirmation={`هل تريدين إلغاء تسجيل ${registration.attendeeName}؟ لا يمكن التراجع عن هذا الإجراء.`}
      />
    </div>
  );
}

export function RegistrationTable({ registrations, mode }: RegistrationTableProps) {
  if (registrations.length === 0) {
    return <EmptyState title="لا توجد تسجيلات هنا" description="ستظهر الأسماء هنا عندما تصل تسجيلات لهذه القائمة." />;
  }

  return (
    <div>
      <div className="table-scroll responsive-table-shell" tabIndex={0} role="region" aria-label="سجلات التسجيل">
      <table className="operational-table responsive-admin-table w-full min-w-[88rem] border-collapse text-right text-sm">
        <caption className="sr-only">سجلات التسجيل ووسائل التواصل والإجراءات</caption>
        <thead>
          <tr>
            <th className="px-5 py-4">المسجل</th>
            <th className="px-5 py-4">الفعالية</th>
            <th className="px-5 py-4">الجوال</th>
            <th className="px-5 py-4">البريد</th>
            <th className="px-5 py-4">الحالة</th>
            <th className="px-5 py-4">الدفع</th>
            <th className="px-5 py-4">رقم المرجع</th>
            <th className="px-5 py-4">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((registration) => (
            <tr key={registration.id} className="border-t border-[var(--color-border)] align-top">
              <td data-label="المسجلة" className="px-5 py-4">
                <span className="block font-bold">{registration.attendeeName}</span>
                {registration.participantAge !== null ? <span className="block text-xs muted-copy">العمر: {formatArabicNumber(registration.participantAge)} — ولية الأمر: {registration.guardianName}</span> : null}
              </td>
              <td data-label="الفعالية" className="px-5 py-4"><span className="block font-bold">{registration.eventTitle}</span><span className="text-xs muted-copy">{formatArabicDateTime(registration.eventStartsAt)}</span></td>
              <td data-label="الجوال" className="data-value px-5 py-4" dir="ltr"><a className="underline decoration-[var(--brand-olive)] underline-offset-4" href={`https://wa.me/${registration.phoneE164.replace("+", "")}`} target="_blank" rel="noreferrer">{registration.phoneE164}</a></td>
              <td data-label="البريد" className="max-w-56 break-all px-5 py-4 md:whitespace-nowrap" dir="ltr">{registration.email ? <a className="underline decoration-[var(--brand-olive)] underline-offset-4" href={`mailto:${registration.email}`}>{registration.email}</a> : "—"}</td>
              <td data-label="الحالة" className="px-5 py-4"><div className="grid justify-items-start gap-2"><StatusBadge status={registration.status} />{registration.status === "registered" ? <StatusBadge status={registration.attendanceStatus} /> : null}{registration.status === "registered" ? <StatusBadge status={registration.checkInStatus === "pending" ? "check_in_pending" : registration.checkInStatus} /> : null}</div></td>
              <td data-label="الدفع" className="px-5 py-4">{registration.status === "registered" ? <RegistrationPaymentStatusForm registrationId={registration.id} currentStatus={registration.paymentStatus} action={setRegistrationPaymentStatusAction.bind(null, registration.id)} /> : "—"}</td>
              <td data-label="رقم المرجع" className="data-value px-5 py-4 text-xs" dir="ltr">{registration.reference}</td>
              <td data-label="الإجراءات" className="px-5 py-4"><RegistrationActions registration={registration} mode={mode} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
