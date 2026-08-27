"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { idleActionResult } from "@/lib/data/action-result";
import { registrationReminderTemplateTokens } from "@/lib/messaging/registration-reminder";
import { saveEventReminderTemplateAction } from "@/app/(dashboard)/admin/(protected)/messages/templates/actions";

export function EventReminderTemplateForm({
  eventId,
  eventTemplate,
  globalTemplate,
}: {
  eventId: string;
  eventTemplate: string | null;
  globalTemplate: string | null;
}) {
  const [state, formAction, pending] = useActionState(saveEventReminderTemplateAction.bind(null, eventId), idleActionResult);
  const { pushToast } = useToast();

  useEffect(() => {
    if (state.status === "success") {
      pushToast("تم حفظ تخصيص الفعالية.", "success");
    } else if (state.status === "error") {
      pushToast(state.message ?? "تعذر حفظ التخصيص. حاولي مرة أخرى.", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire only when the action result changes
  }, [state]);

  return (
    <details className="message-history max-w-3xl">
      <summary>تخصيص قالب التذكير لهذه الفعالية</summary>
      <form action={formAction} className="border-t border-[var(--color-border)] p-6">
        <p className="muted-copy">{eventTemplate ? "يُستخدم هذا التخصيص لهذه الفعالية فقط." : "يُستخدم القالب العام حاليًا حتى تحفظي تخصيصًا."}</p>
        <label htmlFor="event-template-body" className="sr-only">
          نص القالب
        </label>
        <textarea
          id="event-template-body"
          name="body"
          defaultValue={eventTemplate ?? globalTemplate ?? ""}
          rows={9}
          className="field-control mt-4 w-full"
          required
        />
        <p className="mt-3 text-sm muted-copy">المتغيرات المطلوبة: {registrationReminderTemplateTokens.join("، ")}</p>
        <button type="submit" disabled={pending} className="button-primary mt-5">
          {pending ? "جارٍ الحفظ…" : "حفظ تخصيص الفعالية"}
        </button>
      </form>
    </details>
  );
}
