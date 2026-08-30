"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState } from "react";
import type { Registration } from "@/lib/domain/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { formatArabicDateTime, formatArabicNumber } from "@/lib/format/date";
import type { RegistrationPaymentActionState } from "@/app/(dashboard)/admin/(protected)/registrations/actions";
import type { ActionResult } from "@/lib/data/action-result";
import { RegistrationPaymentStatusForm } from "@/features/admin/components/RegistrationPaymentStatusForm";

export interface RegistrationTableActions {
  cancelRegistration: (id: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;
  confirmAttendance: (id: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;
  recordCheckIn: (id: string, outcome: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;
  revokeInvitation: (id: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;
  confirmInvitation: (id: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;
  setPaymentStatus: (id: string, state: RegistrationPaymentActionState, formData: FormData) => Promise<RegistrationPaymentActionState>;
}

interface RegistrationTableProps {
  registrations: readonly Registration[];
  mode: "current" | "waitlist" | "previous";
  selectedId?: string;
  /**
   * Href per registration id, keyed by `registration.id`. A plain serializable map rather than a
   * callback — this table is a Client Component, and a Server Component parent cannot pass it a
   * function prop (React throws "Functions cannot be passed directly to Client Components").
   */
  registrationHrefs: Readonly<Record<string, string>>;
  actions: RegistrationTableActions;
}

function RegistrationActions({
  registration,
  mode,
  actions,
  onChanged,
}: {
  registration: Registration;
  mode: RegistrationTableProps["mode"];
  actions: RegistrationTableActions;
  onChanged: () => void;
}) {
  const canConfirmAttendance = mode === "current" && registration.attendanceStatus === "pending";
  const canCheckIn = mode === "current" && registration.checkInStatus !== "checked_in";
  const canRevokeOrConfirmInvitation = mode === "waitlist" && registration.status === "invited";
  // Every available action stays visible (no hidden menu — see the A11 test below), but exactly
  // one is styled as the row's confident "next step"; the rest recede to secondary/danger.
  // Confirming the invitation (the guest accepted by phone or WhatsApp) is that next step for an
  // invited row, ahead of revoking it — mirroring the design's primary/secondary pairing.
  const primaryAction: "confirm" | "checkIn" | "confirmInvitation" | null = canConfirmAttendance
    ? "confirm"
    : canCheckIn
      ? "checkIn"
      : canRevokeOrConfirmInvitation
        ? "confirmInvitation"
        : null;

  return (
    <div className="flex flex-wrap gap-2">
      {canRevokeOrConfirmInvitation ? (
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
      {canRevokeOrConfirmInvitation ? (
        <ActionButton
          action={actions.confirmInvitation.bind(null, registration.id)}
          label="تأكيد الدعوة"
          pendingLabel="جارٍ التأكيد…"
          className={`${primaryAction === "confirmInvitation" ? "button-primary" : "button-secondary"} min-h-10 px-3 py-2 text-sm`}
          successMessage={`تم تأكيد دعوة ${registration.attendeeName} وتحويل المقعد إلى مسجَّل.`}
          onSuccess={onChanged}
        />
      ) : null}
      {canConfirmAttendance ? (
        <ActionButton
          action={actions.confirmAttendance.bind(null, registration.id)}
          label="تأكيد الحضور"
          pendingLabel="جارٍ التأكيد…"
          className={`${primaryAction === "confirm" ? "button-primary" : "button-secondary"} min-h-10 px-3 py-2 text-sm`}
          successMessage="تم تأكيد الحضور."
          onSuccess={onChanged}
        />
      ) : null}
      {canCheckIn ? (
        <ActionButton
          action={actions.recordCheckIn.bind(null, registration.id, "checked_in")}
          label="تسجيل الحضور"
          pendingLabel="جارٍ الحفظ…"
          className={`${primaryAction === "checkIn" ? "button-primary" : "button-secondary"} min-h-10 px-3 py-2 text-sm`}
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

function RegistrationDetails({
  registration,
  mode,
  actions,
  onChanged,
}: {
  registration: Registration;
  mode: RegistrationTableProps["mode"];
  actions: RegistrationTableActions;
  onChanged: () => void;
}) {
  return (
    <article className="card-surface min-w-0 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--brand-green-deep)]">تفاصيل التسجيل</p>
          <h2 className="mt-1 text-2xl font-bold">{registration.attendeeName}</h2>
          <p className="mt-1 text-sm muted-copy">{registration.eventTitle}</p>
        </div>
        <div className="grid justify-items-start gap-2">
          <StatusBadge status={registration.status} />
          {registration.status === "registered" ? <StatusBadge status={registration.attendanceStatus} /> : null}
          {registration.status === "registered" ? (
            <StatusBadge status={registration.checkInStatus === "pending" ? "check_in_pending" : registration.checkInStatus} />
          ) : null}
        </div>
      </div>
      <dl className="mt-7 grid gap-5 border-y border-[var(--color-border)] py-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="muted-copy">موعد الفعالية</dt>
          <dd className="mt-1 font-bold">{formatArabicDateTime(registration.eventStartsAt)}</dd>
        </div>
        <div>
          <dt className="muted-copy">الدفع</dt>
          <dd className="mt-1">
            {registration.status === "registered" ? (
              mode === "previous" ? (
                <StatusBadge status={registration.paymentStatus} />
              ) : (
                <RegistrationPaymentStatusForm
                  registrationId={registration.id}
                  currentStatus={registration.paymentStatus}
                  action={actions.setPaymentStatus.bind(null, registration.id)}
                />
              )
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="muted-copy">الجوال</dt>
          <dd className="data-value mt-1 font-bold" dir="ltr">
            <a
              className="underline decoration-[var(--brand-olive)] underline-offset-4"
              href={`https://wa.me/${registration.phoneE164.replace("+", "")}`}
              target="_blank"
              rel="noreferrer"
            >
              {registration.phoneE164}
            </a>
          </dd>
        </div>
        <div>
          <dt className="muted-copy">البريد</dt>
          <dd className="mt-1 break-all font-bold" dir="ltr">
            {registration.email ? (
              <a className="underline decoration-[var(--brand-olive)] underline-offset-4" href={`mailto:${registration.email}`}>
                {registration.email}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
        {registration.participantAge !== null ? (
          <div>
            <dt className="muted-copy">بيانات القاصر</dt>
            <dd className="mt-1 font-bold">
              العمر: {formatArabicNumber(registration.participantAge)} · ولية الأمر: {registration.guardianName ?? "—"}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="muted-copy">رقم المرجع</dt>
          <dd className="data-value mt-1 break-all text-xs font-bold" dir="ltr">
            {registration.reference}
          </dd>
        </div>
      </dl>
      <div className="mt-6">
        <p className="mb-3 text-sm font-medium">الإجراءات</p>
        <RegistrationActions registration={registration} mode={mode} actions={actions} onChanged={onChanged} />
      </div>
    </article>
  );
}

interface RegistrationPatch {
  id: string;
  changes: Partial<Registration>;
}

export function RegistrationTable({ registrations, mode, selectedId, registrationHrefs, actions }: RegistrationTableProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const onChanged = () => router.refresh();
  // Applies each mutation to a local, transition-scoped copy of the list the instant an action is
  // submitted, so the row/badge updates before the server round trip (triggered by onChanged below)
  // resolves. React reconciles back to the real `registrations` prop once that refresh lands.
  const [optimisticRegistrations, applyPatch] = useOptimistic(registrations, (current: readonly Registration[], patch: RegistrationPatch) =>
    current.map((registration) => (registration.id === patch.id ? { ...registration, ...patch.changes } : registration)),
  );

  // These actions optimistically flip a status field that also gates which action controls
  // are rendered (e.g. the cancel dialog disappears once status becomes "cancelled") — so the
  // ConfirmDialog/ActionButton that submitted the action unmounts before its own success/error
  // effect can run. Completion (toast + real refresh) is handled here instead, in this
  // always-mounted component, rather than relying on those components' internal state.
  async function runGatingAction(patch: RegistrationPatch, successMessage: string, call: () => Promise<ActionResult>): Promise<ActionResult> {
    applyPatch(patch);
    const result = await call();
    if (result.status === "success") pushToast(successMessage, "success");
    else if (result.status === "error") pushToast(result.message ?? "تعذر تنفيذ الإجراء. حاولي مرة أخرى.", "error");
    onChanged();
    return result;
  }

  const optimisticActions: RegistrationTableActions = {
    cancelRegistration: (id, state, formData) =>
      runGatingAction({ id, changes: { status: "cancelled" } }, "تم إلغاء التسجيل، ويمكن الآن اختيار بديلة من قائمة الانتظار.", () =>
        actions.cancelRegistration(id, state, formData),
      ),
    confirmAttendance: (id, state, formData) =>
      runGatingAction({ id, changes: { attendanceStatus: "confirmed" } }, "تم تأكيد الحضور.", () => actions.confirmAttendance(id, state, formData)),
    recordCheckIn: (id, outcome, state, formData) =>
      runGatingAction({ id, changes: { checkInStatus: outcome as Registration["checkInStatus"] } }, "تم حفظ حالة الحضور.", () =>
        actions.recordCheckIn(id, outcome, state, formData),
      ),
    revokeInvitation: (id, state, formData) =>
      runGatingAction({ id, changes: { status: "waitlisted" } }, "تم سحب الدعوة وإعادة السجل إلى قائمة الانتظار.", () =>
        actions.revokeInvitation(id, state, formData),
      ),
    confirmInvitation: (id, state, formData) =>
      runGatingAction(
        { id, changes: { status: "registered" } },
        "تم تأكيد الدعوة وتحويل المقعد إلى مسجَّل.",
        () => actions.confirmInvitation(id, state, formData),
      ),
    setPaymentStatus: (id, state, formData) => {
      // Payment status doesn't gate any control's visibility, so the form stays mounted and its
      // own success/error handling (inline, not a toast) already works correctly.
      const nextStatus = formData.get("paymentStatus");
      if (typeof nextStatus === "string") applyPatch({ id, changes: { paymentStatus: nextStatus as Registration["paymentStatus"] } });
      return actions.setPaymentStatus(id, state, formData);
    },
  };

  if (registrations.length === 0) return <EmptyState title="لا توجد تسجيلات هنا" description="ستظهر الأسماء هنا عندما تصل تسجيلات لهذه القائمة." />;
  // Selection is local: picking a row used to be a navigation, so every click re-ran the whole
  // server page just to move the detail pane. `localSelectedId` wins once the admin has clicked;
  // until then the `selectedId` prop (from the URL) decides, which keeps rows deep-linkable.
  const activeId = localSelectedId ?? selectedId;
  const selected = optimisticRegistrations.find((registration) => registration.id === activeId) ?? optimisticRegistrations[0]!;
  return (
    <div className="registration-master-detail">
      <aside className="registration-master-list" aria-label="نتائج التسجيلات">
        <p className="mb-3 text-sm font-normal muted-copy">اختاري تسجيلًا لعرض بياناته وإجراءاته.</p>
        {optimisticRegistrations.map((registration) => {
          const active = registration.id === selected.id;
          const className = active ? "registration-master-item registration-master-item--active" : "registration-master-item";
          return (
            <Link
              key={registration.id}
              href={registrationHrefs[registration.id] ?? "#"}
              aria-current={active ? "page" : undefined}
              className={className}
              onClick={(clickEvent) => {
                // Keep the href (deep links, middle-click, no-JS) but swap the pane in this frame
                // instead of paying for a server round trip.
                clickEvent.preventDefault();
                setLocalSelectedId(registration.id);
              }}
            >
              <span className="grid gap-0.5">
                <strong>{registration.attendeeName}</strong>
                <small>{registration.eventTitle}</small>
              </span>
              <span className="grid justify-items-end gap-1">
                <StatusBadge status={registration.status} />
                <small>{formatArabicDateTime(registration.eventStartsAt)}</small>
              </span>
            </Link>
          );
        })}
      </aside>
      <RegistrationDetails registration={selected} mode={mode} actions={optimisticActions} onChanged={onChanged} />
    </div>
  );
}
