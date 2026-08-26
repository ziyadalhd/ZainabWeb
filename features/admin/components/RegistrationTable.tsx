"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Registration } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatArabicDateTime, formatArabicNumber } from "@/lib/format/date";
import type { RegistrationPaymentActionState } from "@/app/(dashboard)/admin/(protected)/registrations/actions";
import type { ActionResult } from "@/lib/data/action-result";
import { RegistrationPaymentStatusForm } from "@/features/admin/components/RegistrationPaymentStatusForm";

export interface RegistrationTableActions {
  cancelRegistration: (id: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;
  confirmAttendance: (id: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;
  recordCheckIn: (id: string, outcome: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;
  revokeInvitation: (id: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;
  setPaymentStatus: (id: string, state: RegistrationPaymentActionState, formData: FormData) => Promise<RegistrationPaymentActionState>;
}

interface RegistrationTableProps {
  registrations: readonly Registration[];
  mode: "current" | "waitlist" | "previous";
  selectedId?: string;
  registrationHref: (registration: Registration) => string;
  actions: RegistrationTableActions;
}

function RegistrationActions({ registration, mode, actions, onChanged }: { registration: Registration; mode: RegistrationTableProps["mode"]; actions: RegistrationTableActions; onChanged: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/admin/events/${registration.eventId}?tab=communications`} className="button-primary min-h-10 px-3 py-2 text-sm">فتح التواصل</Link>
      {mode === "waitlist" && registration.status === "invited" ? (
        <ConfirmDialog
          triggerLabel="سحب الدعوة"
          triggerClassName="button-secondary min-h-10 px-3 py-2 text-sm"
          tone="default"
          title="سحب الدعوة"
          description={`هل تريدين سحب دعوة ${registration.attendeeName} وإعادتها لقائمة الانتظار؟`}
          confirmLabel="سحب الدعوة"
          action={actions.revokeInvitation.bind(null, registration.id)}
          successMessage="تم سحب الدعوة وإعادة السجل إلى قائمة الانتظار."
          onSuccess={onChanged}
        />
      ) : null}
      {mode === "current" && registration.attendanceStatus === "pending" ? (
        <ActionButton
          action={actions.confirmAttendance.bind(null, registration.id)}
          label="تأكيد الحضور"
          pendingLabel="جارٍ التأكيد…"
          className="button-secondary min-h-10 px-3 py-2 text-sm"
          successMessage="تم تأكيد الحضور."
          onSuccess={onChanged}
        />
      ) : null}
      {mode === "current" && registration.checkInStatus !== "checked_in" ? (
        <ActionButton
          action={actions.recordCheckIn.bind(null, registration.id, "checked_in")}
          label="تسجيل الحضور"
          pendingLabel="جارٍ الحفظ…"
          className="button-secondary min-h-10 px-3 py-2 text-sm"
          successMessage="تم حفظ حالة الحضور."
          onSuccess={onChanged}
        />
      ) : null}
      {mode === "current" && registration.checkInStatus !== "absent" ? (
        <ConfirmDialog
          triggerLabel="تسجيل الغياب"
          triggerClassName="button-secondary min-h-10 px-3 py-2 text-sm"
          tone="default"
          title="تسجيل الغياب"
          description={`هل أنت متأكدة أن ${registration.attendeeName} لم تحضر الفعالية؟`}
          confirmLabel="تسجيل الغياب"
          action={actions.recordCheckIn.bind(null, registration.id, "absent")}
          successMessage="تم حفظ حالة الحضور."
          onSuccess={onChanged}
        />
      ) : null}
      {(mode === "current" || mode === "waitlist") && registration.status !== "cancelled" ? (
        <ConfirmDialog
          triggerLabel="إلغاء التسجيل"
          title="إلغاء التسجيل"
          description={`هل تريدين إلغاء تسجيل ${registration.attendeeName}؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmLabel="إلغاء التسجيل"
          action={actions.cancelRegistration.bind(null, registration.id)}
          successMessage="تم إلغاء التسجيل، ويمكن الآن اختيار بديلة من قائمة الانتظار."
          onSuccess={onChanged}
        />
      ) : null}
    </div>
  );
}

function RegistrationDetails({ registration, mode, actions, onChanged }: { registration: Registration; mode: RegistrationTableProps["mode"]; actions: RegistrationTableActions; onChanged: () => void }) {
  return <article className="card-surface min-w-0 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-[var(--brand-green-deep)]">تفاصيل التسجيل</p><h2 className="mt-1 text-2xl font-black">{registration.attendeeName}</h2><p className="mt-1 text-sm muted-copy">{registration.eventTitle}</p></div><div className="grid justify-items-start gap-2"><StatusBadge status={registration.status} />{registration.status === "registered" ? <StatusBadge status={registration.attendanceStatus} /> : null}{registration.status === "registered" ? <StatusBadge status={registration.checkInStatus === "pending" ? "check_in_pending" : registration.checkInStatus} /> : null}</div></div><dl className="mt-7 grid gap-5 border-y border-[var(--color-border)] py-5 text-sm sm:grid-cols-2"><div><dt className="muted-copy">موعد الفعالية</dt><dd className="mt-1 font-bold">{formatArabicDateTime(registration.eventStartsAt)}</dd></div><div><dt className="muted-copy">الدفع</dt><dd className="mt-1">{registration.status === "registered" ? mode === "previous" ? <StatusBadge status={registration.paymentStatus} /> : <RegistrationPaymentStatusForm registrationId={registration.id} currentStatus={registration.paymentStatus} action={actions.setPaymentStatus.bind(null, registration.id)} /> : "—"}</dd></div><div><dt className="muted-copy">الجوال</dt><dd className="data-value mt-1 font-bold" dir="ltr"><a className="underline decoration-[var(--brand-olive)] underline-offset-4" href={`https://wa.me/${registration.phoneE164.replace("+", "")}`} target="_blank" rel="noreferrer">{registration.phoneE164}</a></dd></div><div><dt className="muted-copy">البريد</dt><dd className="mt-1 break-all font-bold" dir="ltr">{registration.email ? <a className="underline decoration-[var(--brand-olive)] underline-offset-4" href={`mailto:${registration.email}`}>{registration.email}</a> : "—"}</dd></div>{registration.participantAge !== null ? <div><dt className="muted-copy">بيانات القاصر</dt><dd className="mt-1 font-bold">العمر: {formatArabicNumber(registration.participantAge)} · ولية الأمر: {registration.guardianName ?? "—"}</dd></div> : null}<div><dt className="muted-copy">رقم المرجع</dt><dd className="data-value mt-1 break-all text-xs font-bold" dir="ltr">{registration.reference}</dd></div></dl><div className="mt-6"><p className="mb-3 text-sm font-bold">الإجراءات</p><RegistrationActions registration={registration} mode={mode} actions={actions} onChanged={onChanged} /></div></article>;
}

export function RegistrationTable({ registrations, mode, selectedId, registrationHref, actions }: RegistrationTableProps) {
  const router = useRouter();
  const onChanged = () => router.refresh();

  if (registrations.length === 0) return <EmptyState title="لا توجد تسجيلات هنا" description="ستظهر الأسماء هنا عندما تصل تسجيلات لهذه القائمة." />;
  const selected = registrations.find((registration) => registration.id === selectedId) ?? registrations[0]!;
  return <div className="registration-master-detail"><aside className="registration-master-list" aria-label="نتائج التسجيلات"><p className="mb-3 text-sm font-bold muted-copy">اختاري تسجيلًا لعرض بياناته وإجراءاته.</p>{registrations.map((registration) => { const active = registration.id === selected.id; const className = active ? "registration-master-item registration-master-item--active" : "registration-master-item"; return <Link key={registration.id} href={registrationHref(registration)} aria-current={active ? "page" : undefined} className={className}><span className="grid gap-0.5"><strong>{registration.attendeeName}</strong><small>{registration.eventTitle}</small></span><span className="grid justify-items-end gap-1"><StatusBadge status={registration.status} /><small>{formatArabicDateTime(registration.eventStartsAt)}</small></span></Link>; })}</aside><RegistrationDetails registration={selected} mode={mode} actions={actions} onChanged={onChanged} /></div>;
}
