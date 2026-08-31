"use client";

import { useMemo, useState, useTransition } from "react";
import type { Event, ManualMessageKind, ManualMessageRecord, Registration } from "@/lib/domain/types";
import { formatArabicDateTime, formatArabicEventDate, formatArabicNumber } from "@/lib/format/date";
import { buildManualMessageContent, manualMessageLabels } from "@/lib/messaging/manual-messages";
import { buildWhatsAppMessageUrl } from "@/lib/messaging/registration-reminder";
import { sendManualWhatsAppMessageAction } from "@/app/(dashboard)/admin/(protected)/events/[id]/message-actions";
import { MessageKindTabs } from "@/features/admin/components/MessageKindTabs";
import { MessageRecipientQueue } from "@/features/admin/components/MessageRecipientQueue";
import { MessageHistoryLog } from "@/features/admin/components/MessageHistoryLog";

interface EventCommunicationsWorkspaceProps {
  event: Event;
  registrations: readonly Registration[];
  messages: readonly ManualMessageRecord[];
  reminderTemplate: string | null;
  now: string;
}

function recipientKey(registrationId: string, kind: ManualMessageKind): string {
  return `${registrationId}:${kind}`;
}

function isEligibleRecipient(registration: Registration, kind: ManualMessageKind): boolean {
  if (kind === "waitlist_invitation") return registration.status === "waitlisted" || registration.status === "invited";
  return registration.status === "registered";
}

function isCategoryActionable(event: Event, kind: ManualMessageKind, now: Date): boolean {
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt ?? event.startsAt);
  const millisecondsUntilStart = startsAt.getTime() - now.getTime();

  if (kind === "cancellation") return event.publicationStatus === "cancelled";
  if (kind === "feedback_request") return endsAt <= now;
  if (event.publicationStatus === "cancelled" || startsAt <= now) return false;
  if (kind === "reminder_24h") return millisecondsUntilStart <= 24 * 60 * 60 * 1000;
  if (kind === "reminder_3h") return millisecondsUntilStart <= 3 * 60 * 60 * 1000;
  return true;
}

function unavailableMessage(kind: ManualMessageKind): string {
  if (kind === "reminder_24h") return "يظهر الإرسال عندما يتبقى ٢٤ ساعة أو أقل على بداية الفعالية.";
  if (kind === "reminder_3h") return "يظهر الإرسال عندما يتبقى ٣ ساعات أو أقل على بداية الفعالية.";
  if (kind === "cancellation") return "يُستخدم الإشعار الموحد بعد تحويل حالة الفعالية إلى ملغاة.";
  if (kind === "feedback_request") return "يتاح طلب التقييم بعد انتهاء الفعالية.";
  if (kind === "waitlist_invitation") return "تُرسل الدعوة فقط بعد اختيار بديلة وتوفر مقعد.";
  return "هذه الرسالة غير متاحة في حالة الفعالية الحالية.";
}

export function EventCommunicationsWorkspace({ event, registrations, messages, reminderTemplate, now: nowIso }: EventCommunicationsWorkspaceProps) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const defaultKind =
    event.publicationStatus === "cancelled" ? "cancellation" : new Date(event.endsAt ?? event.startsAt) <= now ? "feedback_request" : "confirmation";
  const [kind, setKind] = useState<ManualMessageKind>(defaultKind);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [securePaths, setSecurePaths] = useState<Record<string, string | null>>({});
  const [locallySent, setLocallySent] = useState<ReadonlySet<string>>(new Set());
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [error, setError] = useState<"prepare" | "save" | "popup" | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [sending, startSending] = useTransition();

  const currentRecords = useMemo(() => {
    const latest = new Map<string, ManualMessageRecord>();
    for (const message of messages) {
      if (message.kind !== kind || message.supersededAt) continue;
      if (!latest.has(message.registrationId)) latest.set(message.registrationId, message);
    }
    return latest;
  }, [kind, messages]);

  const recipients = registrations.filter((registration) => isEligibleRecipient(registration, kind));
  const isSent = (registration: Registration) => {
    const key = recipientKey(registration.id, kind);
    if (locallySent.has(key)) return true;
    if (kind === "confirmation" && registration.confirmationSentAt) return true;
    return currentRecords.get(registration.id)?.sentAt != null;
  };
  const orderedRecipients = [...recipients].sort((first, second) => {
    const firstSent = isSent(first) ? 1 : 0;
    const secondSent = isSent(second) ? 1 : 0;
    if (firstSent !== secondSent) return firstSent - secondSent;
    return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
  });
  const selected =
    orderedRecipients.find((registration) => registration.id === selectedId) ??
    orderedRecipients.find((registration) => !isSent(registration)) ??
    orderedRecipients[0] ??
    null;
  const selectedKey = selected ? recipientKey(selected.id, kind) : null;
  const selectedSecurePath = selectedKey ? (securePaths[selectedKey] ?? null) : null;
  const selectedSent = selected ? isSent(selected) : false;
  const actionable = isCategoryActionable(event, kind, now);
  const needsActionCount = orderedRecipients.filter((registration) => !isSent(registration)).length;

  function selectKind(messageKind: ManualMessageKind) {
    setKind(messageKind);
    setSelectedId(null);
    setFallbackUrl(null);
    setError(null);
    setCopied(false);
    setCopyError(false);
  }

  function resolvedMessage(registration: Registration, securePath: string | null): string {
    const secureUrl = securePath ? new URL(securePath, window.location.origin).href : kind === "cancellation" ? null : "سيُجهز الرابط الآمن عند فتح واتساب";
    return buildManualMessageContent({
      kind,
      attendeeName: registration.attendeeName,
      eventTitle: event.title,
      eventDate: formatArabicEventDate(event.startsAt),
      secureUrl,
      reminderTemplate,
    });
  }

  /**
   * One click: open WhatsApp and record the send.
   *
   * The blank tab is opened synchronously, inside the click's user-gesture window — a tab opened
   * after the `await` would be blocked as a popup — and is then pointed at the composed WhatsApp
   * URL once the secure link comes back. Recording happens in the same server round trip, so the
   * admin never returns to press a second confirmation.
   */
  function openAndSend() {
    if (!selected || !selectedKey || !actionable || sending) return;
    setError(null);
    setCopied(false);
    setCopyError(false);

    const waitingWindow = window.open("about:blank", "_blank");
    if (waitingWindow) {
      waitingWindow.document.documentElement.lang = "ar";
      waitingWindow.document.documentElement.dir = "rtl";
      waitingWindow.document.title = "جارٍ تجهيز الرسالة";
      waitingWindow.document.body.textContent = "جارٍ تجهيز الرسالة الآمنة…";
    }

    startSending(async () => {
      const result = await sendManualWhatsAppMessageAction(event.id, selected.id, kind);
      if (!result.messageId) {
        waitingWindow?.close();
        setError("prepare");
        return;
      }

      const securePath = result.securePath ?? null;
      setSecurePaths((current) => ({ ...current, [selectedKey]: securePath }));
      const destination = buildWhatsAppMessageUrl(selected.phoneE164, resolvedMessage(selected, securePath));
      if (waitingWindow) waitingWindow.location.href = destination;
      else {
        setFallbackUrl(destination);
        setError("popup");
      }

      if (!result.sentAt) {
        // WhatsApp is open with the right message; only the bookkeeping failed.
        setError("save");
        return;
      }

      setLocallySent((current) => new Set(current).add(selectedKey));
      if (waitingWindow) setFallbackUrl(null);
      const next = orderedRecipients.find((registration) => registration.id !== selected.id && !isSent(registration));
      setSelectedId(next?.id ?? selected.id);
    });
  }

  async function copyMessage() {
    if (!selected) return;
    setCopyError(false);
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(resolvedMessage(selected, selectedSecurePath));
      setCopied(true);
    } catch {
      setCopyError(true);
    }
  }

  const preview = selected
    ? buildManualMessageContent({
        kind,
        attendeeName: selected.attendeeName,
        eventTitle: event.title,
        eventDate: formatArabicEventDate(event.startsAt),
        secureUrl: kind === "cancellation" ? null : selectedSecurePath ? "الرابط الآمن المجهز" : "سيُجهز الرابط الآمن عند الفتح",
        reminderTemplate,
      })
    : null;

  return (
    <div className="event-communications">
      <header className="event-communications__header">
        <div>
          <p className="eyebrow">التواصل اليدوي</p>
          <h3 className="mt-2 text-2xl font-bold">ما الرسالة التالية لهذه الفعالية؟</h3>
          <p className="mt-2 muted-copy">ضغطة واحدة تفتح واتساب وتسجّل الرسالة كمرسلة، ثم تنتقل تلقائيًا للمستلمة التالية.</p>
        </div>
        <div className="event-communications__summary" aria-live="polite">
          <strong>{formatArabicNumber(needsActionCount)}</strong>
          <span>تحتاج إرسالًا</span>
        </div>
      </header>

      <MessageKindTabs event={event} messages={messages} activeKind={kind} isCategoryActionable={isCategoryActionable} now={now} onSelect={selectKind} />

      {!actionable && !messages.some((message) => message.kind === kind) ? <p className="notice-info mt-5">{unavailableMessage(kind)}</p> : null}

      {orderedRecipients.length ? (
        <div className="message-workspace mt-5">
          <MessageRecipientQueue
            recipients={orderedRecipients}
            selectedId={selected?.id}
            kind={kind}
            isSent={isSent}
            onSelect={setSelectedId}
          />

          {selected ? (
            <section className="message-composer" aria-labelledby="message-composer-heading">
              <div className="message-composer__identity">
                <div>
                  <p className="eyebrow">الرسالة الحالية</p>
                  <h4 id="message-composer-heading" className="mt-2 text-2xl font-bold">
                    {selected.attendeeName}
                  </h4>
                </div>
                <span className={selectedSent ? "message-state message-state--sent" : "message-state"}>
                  {selectedSent ? "سُجّل الإرسال" : manualMessageLabels[kind]}
                </span>
              </div>

              <div className="message-letter" aria-label="معاينة نص الرسالة">
                <p>{preview}</p>
              </div>

              {currentRecords.get(selected.id)?.sentAt ? (
                <p className="notice-success">سُجل الإرسال في {formatArabicDateTime(currentRecords.get(selected.id)!.sentAt!)}</p>
              ) : null}
              {currentRecords.get(selected.id) && !currentRecords.get(selected.id)?.sentAt && !selectedSecurePath ? (
                <p className="notice-info">يوجد رابط قديم غير مسجَّل. الفتح يستبدله برابط آمن جديد.</p>
              ) : null}
              {error === "prepare" ? (
                <p role="alert" className="notice-error">
                  تعذر تجهيز الرابط. لم تُسجل الرسالة كمرسلة؛ حاولي مرة أخرى.
                </p>
              ) : null}
              {error === "save" ? (
                <p role="alert" className="notice-error">
                  فُتحت الرسالة في واتساب لكن تعذر تسجيلها كمرسلة. أرسليها ثم افتحيها مرة أخرى لتسجيلها.
                </p>
              ) : null}
              {error === "popup" ? (
                <p role="alert" className="notice-info">
                  منع المتصفح النافذة الجديدة. استخدمي رابط الفتح المباشر أدناه.
                </p>
              ) : null}
              {copyError ? (
                <p role="alert" className="notice-error">
                  تعذر نسخ النص. حدديه وانسخيه يدويًا.
                </p>
              ) : null}

              <div className="message-composer__actions">
                <button type="button" disabled={!actionable || sending} onClick={openAndSend} className={selectedSent ? "button-secondary" : "button-primary"}>
                  {sending ? "جارٍ فتح واتساب…" : selectedSent ? "إعادة الفتح في واتساب" : "فتح في واتساب"}
                </button>
                <button type="button" onClick={copyMessage} className="button-quiet">
                  {copied ? "نُسخ النص" : "نسخ النص"}
                </button>
                {fallbackUrl ? (
                  <a href={fallbackUrl} className="button-secondary" target="_blank" rel="noreferrer">
                    فتح واتساب مباشرة
                  </a>
                ) : null}
              </div>
              <p className="mt-3 text-xs muted-copy">يُسجَّل الإرسال تلقائيًا عند الفتح. التسجيل لا يعني أن الرسالة وصلت — إن لم يكتمل الإرسال في واتساب، أعيدي الفتح.</p>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="card-surface mt-5 p-6">
          <h4 className="text-lg font-bold">لا توجد مستلمات لهذه الرسالة</h4>
          <p className="mt-2 muted-copy">ستظهر الأسماء هنا عندما تنطبق حالة التسجيل ونوع الرسالة.</p>
        </div>
      )}

      <MessageHistoryLog messages={messages} registrations={registrations} />
    </div>
  );
}
