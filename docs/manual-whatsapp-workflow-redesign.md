# Manual WhatsApp Workflow Redesign

**Status:** Working plan for owner review
**Scope:** Administrator-only, event-centered manual WhatsApp operations
**Provider boundary:** No automated WhatsApp provider, bulk send, delivery webhook, or delivery claim

## 1. Problem statement

The current workflow is technically safe but operationally fragmented. The administrator sees several message-related actions across the event registrations tab, the event communications tab, and `/admin/messages`. Preparing a reminder is a separate server mutation from opening WhatsApp, and marking it as sent is a third action. While the server action runs, the interface only changes the button label, so the experience feels stuck.

Evidence from the current implementation:

- `RegistrationReminderButton` requires **prepare**, then **open**, then **mark sent**.
- `prepareRegistrationReminderAction` invalidates six administration routes before returning.
- Event workspaces call broad repository methods and then filter all registrations and feedback in application memory.
- `/admin/messages` loads all future registered recipients and all reminder history before choosing one recipient.
- Confirmation, reminders, waitlist invitations, cancellation notices, and feedback links use different components and status conventions.
- The screenshot shows multiple similar actions competing in one registration detail panel without one dominant next step.

The redesign must make the next action obvious, keep the user inside the selected event, and make every wait state finite and understandable.

## 2. Approved boundaries preserved

- WhatsApp remains a manual administrator action using a prefilled `wa.me` destination.
- Opening WhatsApp is not evidence that the message was sent or delivered.
- The administrator separately marks a message as sent.
- No automatic sending, bulk tab opening, provider integration, or delivery status is introduced.
- Reminder timing remains 24 hours and 3 hours before the event.
- Cancellation uses the approved standard message without a custom reason field.
- Global template defaults and explicit per-event overrides remain supported.
- All operational messaging for a registration is centered inside its event workspace.
- Secure management links continue to use long random tokens with only hashes stored.

## 3. Target experience

### Single job

The `التواصل` tab answers one question: **What message needs to be sent next for this event?**

### Information architecture

The event workspace remains the canonical entry point:

```text
الفعالية
└── التواصل
    ├── يحتاج إجراءً
    ├── أُرسل يدويًا
    ├── سجل الرسائل
    └── القوالب
```

`/admin/messages` stops being a second operational workspace. It becomes a compatibility route that sends the administrator to the event list or the relevant event communication tab. The overview action queue may deep-link directly to the affected event and message type.

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────────────┐
│ التواصل — مجالسة مع كتاب                   ٣ تحتاج إرسالًا · ٥ أُرسلت │
├──────────────────────────────────────────────────────────────────────┤
│ [تأكيد التسجيل] [تذكير ٢٤ ساعة] [تذكير ٣ ساعات] [سجل الرسائل]       │
├────────────────────────────┬─────────────────────────────────────────┤
│ قائمة المستلمات            │ الرسالة الحالية                         │
│ ● زياد   يحتاج إرسالًا     │ زياد · +966…                            │
│ ○ سارة   أُرسلت            │                                         │
│ ○ نورة   تحتاج إرسالًا     │ نص الرسالة بعد تعبئة المتغيرات          │
│                            │                                         │
│                            │ ① تجهيز الرابط  ② فتح WhatsApp  ③ تم الإرسال │
│                            │                                         │
│                            │ [فتح الرسالة في WhatsApp]                │
└────────────────────────────┴─────────────────────────────────────────┘
```

### Mobile wireframe

```text
التواصل — مجالسة مع كتاب
٣ تحتاج إرسالًا

[نوع الرسالة ▾]

زياد · يحتاج إرسالًا
نص الرسالة بعد تعبئة المتغيرات

① تجهيز الرابط
② فتح WhatsApp
③ تأكيد الإرسال

[فتح الرسالة في WhatsApp]
[التالي: سارة]
```

### Visual direction

- Reuse the authoritative club palette: forest `#204f28`, olive `#708a58`, amber `#ffb623`, page `#fffbef`, and surface `#fffef8`.
- Keep Thmanyah Sans for headings, body, and operational data; use weight and size rather than introducing another family.
- Use the amber color only for the active queue item and current workflow step.
- The signature element is a real three-step operational rail: `تجهيز الرابط → فتح WhatsApp → تأكيد الإرسال`. It encodes the actual manual process instead of decorating the page.
- Present the personalized message as a quiet correspondence slip, not a phone mockup. The text is the product; ornamental WhatsApp chrome would add noise.

## 4. Primary interaction

The primary button is always named after the outcome: `فتح الرسالة في WhatsApp`. There is no primary action named `تجهيز`.

1. The click synchronously opens a lightweight internal window that says `جارٍ تجهيز الرسالة…` so the browser does not block the later WhatsApp navigation.
2. The client requests an idempotent recipient-specific secure link.
3. The internal window redirects to the prefilled WhatsApp destination as soon as the link is ready.
4. The main workspace immediately changes to `بانتظار تأكيد الإرسال`.
5. The administrator selects `تم الإرسال` only after sending in WhatsApp.
6. The queue marks the item sent and advances to the next unsent recipient without a full-page reload.

If the popup is blocked, the same panel provides `فتح في هذه الصفحة` and `نسخ نص الرسالة`. Neither fallback marks the message as sent.

## 5. Message categories

| Category | Appears when | Completion evidence |
| --- | --- | --- |
| `تأكيد التسجيل` | Active registration has no manually recorded confirmation | Administrator marks sent |
| `تذكير ٢٤ ساعة` | Event is within the approved 24-hour window and the reminder is unsent | Administrator marks sent |
| `تذكير ٣ ساعات` | Event is within the approved 3-hour window and the reminder is unsent | Administrator marks sent |
| `دعوة قائمة الانتظار` | Administrator explicitly selects a replacement | Invitation state plus separate manual sent mark |
| `إشعار الإلغاء` | Event status is cancelled and affected registration is active | Administrator marks sent; standard template only |
| `طلب التقييم` | Event has ended and the response link is available and unused | Administrator marks sent; response state remains separate |

The interface never displays `تم التسليم` because no provider can prove delivery in the manual phase.

## 6. State model

Each recipient/message category uses explicit operational states:

- `needs_action`: no usable draft has been opened and no send is recorded.
- `preparing`: a secure link is being issued.
- `ready`: WhatsApp can be opened; this does not mean sent.
- `awaiting_sent_confirmation`: WhatsApp was opened, but no send is recorded.
- `marked_sent`: the administrator says it was sent manually.
- `failed`: the preparation or sent-mark mutation failed and can be retried safely.
- `superseded`: an unused prepared token was replaced; it is never shown as sent.

`delivered`, `read`, and provider `failed` are reserved for a future approved provider integration.

## 7. Performance and reliability work

### Query scope

- Add `listByEvent(eventId)` and `listMessageQueue(eventId, messageKind, page)` repository methods.
- Stop loading every registration, event, reminder, and feedback row for one event workspace.
- Select only the fields needed by the queue and details panel.
- Keep pagination server-side for large recipient lists.

### Mutation scope

- Replace broad `revalidateRegistrationViews()` calls in message actions with the current event communication path and overview action-count invalidation only.
- Return the prepared message draft directly to the client rather than forcing a full Server Component refresh.
- Keep sent marking as a small idempotent mutation and update the current queue optimistically after success.

### Idempotency

- Add a message category to reminder/message metadata.
- Permit only one current unsent prepared item per registration and category.
- Replacing an unused prepared item supersedes its token before issuing another.
- Repeating `تم الإرسال` keeps the first sent timestamp and does not create a duplicate record.

### Failure handling

- A preparation timeout never marks the message sent.
- Retrying a failed preparation cannot create multiple current drafts.
- Errors identify the failed step: `تعذر تجهيز الرابط`, `تعذر فتح WhatsApp`, or `تعذر حفظ حالة الإرسال`.
- If the session expires, preserve the selected recipient and return to the same event/message category after authentication.

## 8. Data migration direction

Use a forward-only migration after verifying the development database:

1. Extend manual message metadata with an approved `message_kind` discriminator.
2. Add `superseded_at` for unused replaced drafts.
3. Add partial uniqueness for one current prepared item per registration and message kind.
4. Keep `prepared_at` and `sent_at`; do not store message bodies, recipient names, phone numbers, or plaintext tokens in the message log.
5. Preserve existing reminder rows as `registration_reminder` history during migration.
6. Keep confirmation, attendance, check-in, payment, registration, and message state separate.

The exact migration is implementation work and must be generated through the installed Supabase CLI, reviewed, applied in development first, and checked with SQL/RLS tests before production.

## 9. Component and server boundaries

- `EventCommunicationsWorkspace` — Server Component; loads the event and scoped queue summary.
- `MessageCategoryTabs` — client navigation for approved message categories.
- `RecipientQueue` — paginated list with `needs action` and `sent` filters.
- `MessageWorkspace` — personalized preview and the only primary action.
- `MessageProgressRail` — accessible three-step state indicator.
- `openManualWhatsAppMessageAction` — issues or replaces one secure draft and returns the WhatsApp destination.
- `markManualMessageSentAction` — idempotently records the administrator declaration.
- Provider-neutral repository contracts remain separate from Supabase adapters.

## 10. Implementation phases

### Phase 0 — Unstick the current workflow (P0, 1–2 engineering days)

- Move all reminder operations into the event `التواصل` tab.
- Replace broad data loads with event-scoped queries.
- Limit revalidation to the affected event workspace and overview action count.
- Add precise pending, failure, and retry states.
- Remove duplicate reminder actions from the registration detail panel once the event workspace replacement is available.

**Exit:** preparing and marking one message does not reload unrelated administration routes, and the user always sees which step is running.

### Phase 1 — One-click open and sequential queue (P0, 2–4 engineering days)

- Build the split queue/workspace layout and mobile stack.
- Implement the synchronous internal-window handoff to avoid popup blocking.
- Combine secure-link preparation and WhatsApp opening under `فتح الرسالة في WhatsApp`.
- Add sent confirmation and automatic advance to the next unsent recipient.
- Add idempotent message-kind metadata and superseding of unused drafts.

**Exit:** one click opens a personalized WhatsApp message, one separate click records sent, and no duplicate current draft is possible.

### Phase 2 — Complete event communication lifecycle (P1, 2–3 engineering days)

- Add confirmation, 24-hour reminder, 3-hour reminder, waitlist invitation, standard cancellation, and feedback-request categories.
- Provide an event-local history with prepared/sent timestamps.
- Consolidate global defaults and per-event template overrides into the same workspace.
- Show missing template variables inline and preview the resolved Arabic message before saving.
- Redirect the legacy `/admin/messages` workflow to the event-centered experience.

**Exit:** every approved manual event message is managed and audited from its event.

### Phase 3 — Verification and controlled release (P0, 1–2 engineering days)

- Unit-test template rendering, status transitions, idempotency, and error mapping.
- SQL/RLS-test message issuance, superseding, sent marking, and cross-admin authorization.
- Browser-test the full manual flow at mobile and desktop widths with a real administrator session.
- Measure initial event-communication load, prepare-to-open time, and mark-sent time.
- Deploy to Preview, complete owner acceptance, then promote the verified deployment.

**Exit:** all acceptance criteria below are evidenced in Preview before production promotion.

## 11. Acceptance criteria

- The event `التواصل` tab is the canonical message workspace.
- A primary action is never labeled only `تجهيز`.
- The user cannot click the same preparation action repeatedly while it is pending.
- The interface shows the current recipient, message category, personalized preview, and exact next action.
- Opening WhatsApp does not mark a message sent.
- Marking sent does not reload the whole event workspace and advances to the next unsent recipient.
- A retry cannot create duplicate current drafts or duplicate sent timestamps.
- No manual status claims provider delivery or read evidence.
- No message body, phone, name, or plaintext secure token is stored in the manual message log.
- Arabic RTL keyboard use works at `320`, `390`, `768`, and `1440` pixel representative widths.
- `pnpm lint`, `pnpm typecheck`, all applicable tests, SQL/RLS tests, and `pnpm build` pass.
- Preview browser verification covers confirmation, reminder, sent marking, retry after failure, empty queue, and popup-blocked fallback.

## 12. Proposed performance targets

- Event communication page usable within 1.5 seconds at p95 after server response begins.
- Primary click gives visible feedback within 100 milliseconds.
- Secure-link preparation and WhatsApp navigation complete within 2 seconds at p95 under normal service conditions.
- Sent marking completes within 1 second at p95.
- No message mutation triggers broad reads across unrelated events.

These are acceptance targets for implementation and measurement, not claims about the current production behavior.

## 13. Non-goals

- Automated WhatsApp or an unofficial provider.
- Bulk sending or opening several tabs at once.
- Delivery/read receipts.
- Marketing broadcasts to interested contacts.
- Online payment or message-based payment collection.
- Custom cancellation reasons.
