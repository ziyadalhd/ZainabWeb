"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  findMissingTokens,
  messageTemplateDefinitions,
  messageTemplateTokenLabels,
  renderMessageTemplate,
  type MessageTemplateKind,
} from "@/lib/messaging/message-templates";
import { saveMessageTemplateAction } from "@/app/(dashboard)/admin/(protected)/messages/templates/actions";
import { idleActionResult } from "@/lib/data/action-result";
import { useToast } from "@/components/ui/ToastProvider";

/** Stand-in values so the preview reads like a real message. */
const previewValues = {
  attendeeName: "سارة",
  eventTitle: "أمسية القراءة",
  eventDate: "الخميس ٢ أكتوبر",
  managementUrl: "https://bayn-cultural-club.vercel.app/bookings/…",
};

interface MessageTemplateEditorProps {
  kind: MessageTemplateKind;
  /** Saved text, or null to start from the built-in default. */
  body: string | null;
  /** Set when editing one event's override rather than the global text. */
  eventId?: string;
  /** Global text this event falls back to, shown for comparison. */
  globalBody?: string | null;
}

export function MessageTemplateEditor({ kind, body, eventId, globalBody }: MessageTemplateEditorProps) {
  const definition = messageTemplateDefinitions[kind];
  const [text, setText] = useState(body ?? definition.defaultBody);
  const [state, formAction, pending] = useActionState(saveMessageTemplateAction, idleActionResult);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    if (state.status === "success") pushToast(`حُفظ نص «${definition.label}».`, "success");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire only when the action result changes
  }, [state]);

  /** Inserts a variable where the cursor sits, so no one has to type the braces. */
  function insertToken(token: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((current) => `${current}${token}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = `${text.slice(0, start)}${token}${text.slice(end)}`;
    setText(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  }

  const missing = findMissingTokens(kind, text);
  const preview = renderMessageTemplate(text, previewValues);
  const isDefault = text.trim() === definition.defaultBody.trim();
  const changed = text.trim() !== (body ?? definition.defaultBody).trim();

  return (
    <section className="form-surface p-5 sm:p-7" aria-labelledby={`template-${kind}-heading`}>
      <h3 id={`template-${kind}-heading`} className="text-lg font-bold text-[var(--brand-forest)]">
        {definition.label}
      </h3>
      <p className="mt-1 text-sm muted-copy">{definition.description}</p>

      <form action={formAction} className="mt-5">
        <input type="hidden" name="kind" value={kind} />
        {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}

        <p className="text-sm font-medium">أضيفي متغيرًا:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {definition.tokens.map((token) => (
            <button
              key={token}
              type="button"
              onClick={() => insertToken(token)}
              className="button-quiet min-h-9 px-3 py-1.5 text-sm"
            >
              {messageTemplateTokenLabels[token]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs muted-copy">
          المتغير يُستبدل تلقائيًا بالقيمة الحقيقية عند تجهيز كل رسالة.
        </p>

        <label htmlFor={`template-${kind}-body`} className="mt-5 block font-medium">
          نص الرسالة
        </label>
        <textarea
          id={`template-${kind}-body`}
          ref={textareaRef}
          name="body"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={12}
          maxLength={2000}
          className="field-control mt-2 w-full leading-8"
          dir="rtl"
        />
        <p className="mt-1 text-xs muted-copy">{text.length} من 2000 حرف</p>

        {missing.length > 0 ? (
          <p role="alert" className="notice-error mt-4">
            الرسالة ناقصها {missing.map((token) => `«${messageTemplateTokenLabels[token]}»`).join("، ")}. أضيفيها قبل الحفظ.
          </p>
        ) : null}
        {state.status === "error" ? (
          <p role="alert" className="notice-error mt-4">
            {state.message}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending || missing.length > 0 || !changed} className="button-primary min-h-11 px-5 py-2.5">
            {pending ? "جارٍ الحفظ…" : "حفظ النص"}
          </button>
          <button
            type="button"
            onClick={() => setText(definition.defaultBody)}
            disabled={isDefault}
            className="button-quiet min-h-11 px-4 py-2.5"
          >
            استعادة النص الأصلي
          </button>
          {globalBody !== undefined && globalBody ? (
            <button type="button" onClick={() => setText(globalBody)} className="button-quiet min-h-11 px-4 py-2.5">
              استخدام النص العام
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-7 border-t border-[var(--color-border)] pt-5">
        <p className="text-sm font-medium">معاينة الرسالة كما تصل المشاركة</p>
        <pre className="mt-3 whitespace-pre-wrap break-words bg-[var(--color-surface-muted)] p-4 text-sm leading-8" dir="rtl">
          {preview}
        </pre>
      </div>
    </section>
  );
}
