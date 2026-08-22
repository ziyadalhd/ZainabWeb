# Admin Experience Redesign Plan

Status: **Implementation in progress — foundational navigation, Overview, and Event Workspace delivered**
Repository audit date: `2026-08-20`
Product-owner approval date: `2026-08-20`
Scope: protected admin experience only
Implementation performed: **Phase-one foundations started on 2026-08-20; see the implementation note below.**

This plan is based on the repository documentation, current application code, current Supabase schema and repository contracts, and a read-only review of the deployed protected dashboard at desktop, laptop/tablet, and mobile widths. The product owner approved the decisions recorded below and subsequently authorized implementation on 2026-08-20. This implementation has introduced one local, unapplied migration for templates; it has not added a messaging provider or other external service.

## Approved Product-Owner Decisions

1. The Overview is action-first; `يحتاج انتباهك` leads and metrics are secondary.
2. Phase 1 uses the Attention Queue and Recent Activity only; no notification center or bell.
3. Message templates use editable global defaults plus explicit per-event overrides, implemented after the manual outbox foundation.
4. Event duplication is a P2 capability that creates a new draft from reusable event content/settings only; it copies no registrations, messages, tokens, feedback, or history.
5. The current interested-contact consent baseline is email-only. It must not be expanded to WhatsApp marketing without a later explicit consent decision.
6. Event cancellation uses one approved standard cancellation-message template with event facts and no custom cancellation-reason field.
7. Implementation began after the product owner gave a separate explicit instruction on 2026-08-20.

## Implementation note — 2026-08-20

- Implemented the seven-domain admin navigation with active-route indication across desktop and mobile surfaces.
- Replaced the Overview KPI wall with an action-first operating ribbon, derived `يحتاج انتباهك` queue, upcoming agenda, secondary operational metrics, and Recent Activity.
- Added `/admin/events/[id]` as the Event Workspace with event-scoped overview, registrations, waitlist, communications, feedback, and settings tabs. It aggregates only event-linked data; service requests and contacts remain outside it.
- Extended the read-only admin feedback contract with its existing `eventId`, allowing the workspace to filter feedback by the stable event identifier rather than the non-unique title.
- Consolidated upcoming, waitlist/invited, and previous/cancelled registration views into `/admin/registrations`, with URL-backed view tabs and page-level retrieval by name, phone, email, event, or reference. Legacy URLs redirect to the relevant view.
- Replaced the empty Messages page with a sequential manual WhatsApp outbox. The administrator prepares one recipient-specific reminder at a time, opens one WhatsApp destination under a user gesture, and explicitly records manual sending before advancing. It does not claim delivery or use an automated provider.
- Replaced the all-expanded requests feed with a URL-backed master-detail interface. It filters and searches the list before loading the selected request's conflict warning and editable offer/payment controls; it no longer issues one conflict lookup per visible booking request.
- Added the forward migration `20260820082341_add_message_templates.sql` for one editable global registration-reminder default and explicit per-event overrides. It is deliberately not applied because the linked development project has unrelated earlier local migrations pending; applying this migration safely requires the owner to review and authorize those prerequisite migrations first.
- Not yet implemented: repository-level pagination/filtering, template UI after the migration is safely applied, event cancellation lifecycle, duplication, and notification persistence. No claim of production readiness is made for these remaining redesign areas.

## 1. Executive Summary

The current admin is a collection of functional screens, but it does not yet behave like one operating system. Its information architecture follows database entities and implementation milestones: current registrations, previous registrations, waitlist, messages, surveys, interested contacts, and events are separate destinations even when the administrator is performing one event-level job. The result is repeated scanning, context switching, and action overload.

The redesign strategy is **task-first, event-centered, and progressively disclosed**:

1. Turn the Overview into an action-oriented command center, not a wall of totals.
2. Introduce an Event Workspace that keeps event-linked work in one context.
3. Consolidate registration states into one global operations page while preserving event-scoped views.
4. Replace the manual one-row-at-a-time communications experience with a structured manual outbox that still respects browser and WhatsApp limitations.
5. Reduce the sidebar from 11 flat destinations to 7 major domains.
6. Use a master-detail pattern for requests and dense operational lists so the administrator can scan first and expand only what she needs.
7. Delay a full notification center, global command search, automated WhatsApp, and advanced analytics until their data and operational value justify their cost.

The largest product correction is conceptual: **workshop applications, space/celebration requests, and interested contacts do not belong inside an Event Workspace**, because the current data model does not relate them to an event. The workspace should contain only event-linked registrations, waitlist entries, communications, feedback, and event settings.

## 2. Current Admin Architecture

### 2.1 Current route map

```text
/admin                                  Overview
/admin/calendar                         Event-only month calendar
/admin/events                           All events
/admin/events/new                       Create event draft
/admin/events/[id]/edit                 Edit event + poster controls
/admin/requests                         All booking and workshop requests
/admin/registrations/current            Upcoming registered attendees
/admin/registrations/previous           Past and cancelled registrations
/admin/waitlist                         Waitlisted and invited attendees
/admin/interested                       Consented future-event contacts
/admin/messages                         Empty instructional page
/admin/surveys                          Submitted event feedback
/admin/content                          Site content and contact settings
```

The sidebar exposes all 11 primary destinations as peers in `lib/navigation.ts:23`. Desktop and mobile navigation render the same flat list (`components/layout/AdminSidebar.tsx:13`, `components/navigation/MobileNavigation.tsx:57`). Neither navigation surface identifies the current route with an active state or `aria-current`.

### 2.2 Current domain relationships

```text
Event
├── Registrations
│   ├── registered
│   ├── waitlisted
│   ├── invited
│   └── cancelled
├── Registration reminders
└── Event feedback links / responses

Service request (independent of Event)
├── space_booking
├── celebration_booking
└── workshop_application

Interested contact (global consent; no event_id)

Site settings (global content/contact/default venue)
```

This relationship map is the boundary for the proposed information architecture. An Event Workspace may safely aggregate the first group. It must not imply relationships that the schema does not have.

### 2.3 Current workflow map

- Event creation and editing are centralized in a form, but event operations after creation are not.
- The calendar links directly to event edit, even when the likely job is registrations, capacity, or event-day operations (`features/admin/components/CalendarMonthGrid.tsx`).
- Registration lifecycle states are split across three top-level pages.
- Communication controls are embedded inside each registration row. The Messages page only tells the administrator to return to registrations (`app/(dashboard)/admin/(protected)/messages/page.tsx:14`).
- Feedback links are generated per attendee from previous registrations, while submitted responses live on another global page.
- Requests render every record, its full detail, conflicts, and its mutation form in one long stream (`app/(dashboard)/admin/(protected)/requests/page.tsx:26`).

### 2.4 Documentation vs code vs deployed UX

| Approved or documented behavior | Current implementation | Redesign implication |
| --- | --- | --- |
| Unified calendar includes events, accepted bookings, and pending requests (`PLAN.md`) | Calendar queries and displays events only | Calendar redesign needs a unified read model; it is not a visual-only change. |
| Event lifecycle includes `cancelled` | Event type and database constraint only support `draft`, `published`, `archived` (`lib/domain/types.ts`, initial event migration) | Event cancellation must be implemented as a retained lifecycle state before exposing a cancellation action. |
| Search by name, phone, or reference | No admin list has search | Page-level server search is a priority; global search comes later. |
| Messages are tracked and reminders occur at 24h and 3h | Current reminder record has prepared/sent timestamps but no reminder kind; manual reminder is one row at a time | Communications needs a purpose-aware queue and idempotent message-attempt model. |
| Events have a venue, with a default and possible override | Event domain model has no venue field; only global site settings hold default venue data | Do not show invented per-event location in calendar/workspace until the event data model supports it. |
| Message templates exist | Current Arabic WhatsApp text is hardcoded across several components and one helper | Template UX requires a real template contract; it is not present today. |
| Interested contacts represent future-event consent | Contacts have no event relationship | Rename/reframe as contacts, not “interest in an event”; no event filter or conversion metric yet. |
| No public accounts | No public user model or user-management page | “New user registered” is not a valid notification; “new event registration” is. |

## 3. UX Problems

### Critical

#### C1. Event operations lose event context

**Problem**
Registrations, waitlist, communications, and feedback are event-linked but live in separate global pages.

**Evidence from current implementation**
The sidebar exposes separate routes for current registrations, previous registrations, waitlist, messages, surveys, and events. There is no `/admin/events/[id]` operational route; only `/edit` exists.

**Impact on admin**
The administrator must remember an event name while moving between screens and visually scan mixed-event records repeatedly.

**Recommended direction**
Add an Event Workspace with event-scoped Overview, Registrations, Waitlist, Communications, Feedback, and Settings. Preserve a global Registrations page for cross-event work.

#### C2. The Overview reports totals but does not identify the next job

**Problem**
The dashboard gives six equally weighted statistics and then lists every event.

**Evidence from current implementation**
`features/admin/components/AdminOverview.tsx` counts all published events and all published capacity without limiting them to upcoming events, while the explanatory note says published events appear publicly when upcoming. It also counts every upcoming `unpaid` registration as payment work without excluding free bookings. The deployed page lists past and archived events in the command center.

**Impact on admin**
The administrator cannot quickly answer “What needs attention now?” and may see misleading payment or capacity signals.

**Recommended direction**
Lead with an Attention Queue and next-seven-days schedule. Keep only contextual KPIs whose definitions are visible and correct.

#### C3. Manual messaging scales linearly and the Messages page is a dead end

**Problem**
Each attendee requires an individual prepare → open WhatsApp → return → mark sent sequence. There is no queue-level progress or recipient preview.

**Evidence from current implementation**
`RegistrationReminderButton` owns the full workflow per table row. `app/(dashboard)/admin/(protected)/messages/page.tsx:15` displays an empty state that redirects the administrator back to registrations. Message bodies are hardcoded in `lib/messaging/registration-reminder.ts`, `WaitlistInviteButton.tsx`, and `RegistrationFeedbackButton.tsx`.

**Impact on admin**
Repeated work, lost progress, inconsistent message wording, and a high chance of messaging the wrong person when the list grows.

**Recommended direction**
Build a structured manual outbox: select recipients once, choose purpose/template once, preview once, then process a one-recipient-at-a-time send queue with explicit progress.

#### C4. Request review renders every detail and form at once

**Problem**
The requests page is a long stack of expanded records, full workshop descriptions, conflicts, offer forms, and payment forms.

**Evidence from current implementation**
Every request becomes a full `<article>` and applicable form (`app/(dashboard)/admin/(protected)/requests/page.tsx:26-63`). Conflict lookup is performed once per booking request with `Promise.all` (`:22`).

**Impact on admin**
Low scanability, heavy scrolling, weak queue prioritization, and increasing query/DOM cost as records grow.

**Recommended direction**
Use a filterable request list plus a deep-linkable detail drawer/page. Batch conflict retrieval and show the full offer editor only after selecting a record.

#### C5. Documented lifecycle behavior cannot be safely operated

**Problem**
The approved product retains cancelled events and notifies registrants, but the current event state has no `cancelled` value or cancellation action.

**Evidence from current implementation**
`EventPublicationStatus` is `draft | published | archived`; `AdminEventRepository.changeStatus` accepts only those values. The event table offers publish/archive/draft, not cancel.

**Impact on admin**
Archive can be mistaken for cancellation even though it does not express the same business event or trigger registrant communication/reconfirmation behavior.

**Recommended direction**
Treat event cancellation as a P0 lifecycle correction with its own retained status, safeguards, affected-recipient preview, and follow-up tasks. Do not add hard delete.

### High

#### H1. Navigation is flat, long, and has no active location

**Evidence**
11 top-level items; identical link styling for every route; no `aria-current` or active indicator.

**Impact**
Poor wayfinding and high choice load, especially in the mobile sheet.

**Direction**
Reduce to 7 major domains and show a clear active state. Put subdomains inside each domain page or workspace.

#### H2. Registration rows expose too many actions simultaneously

**Evidence**
`RegistrationTable.tsx:99` creates an 88rem-wide table. Each row can include reminders, attendance confirmation, check-in, absence, payment form, cancellation, waitlist invitation, WhatsApp, and feedback actions.

**Impact**
The primary action is unclear; row height becomes unpredictable after preparing a link; accidental destructive actions are more likely.

**Direction**
Keep one contextual primary action, move details and secondary actions into a drawer, and use a “More” menu for low-frequency actions.

#### H3. Laptop/tablet behavior is inefficient

**Evidence**
At widths below 1024px, every operational table becomes a vertical card stack (`app/globals.css:655`). In the deployed 1000px-wide review, six events became six tall cards. At a 1200px viewport with the desktop sidebar, the Overview table caused page-level horizontal overflow because the content region was narrower than the table minimum.

**Impact**
Loss of information density on common laptop/tablet widths and difficult horizontal scanning on smaller desktop windows.

**Direction**
Use a responsive data-grid/master-detail layout: dense rows at tablet/laptop widths, cards only on narrow phones, and never page-level horizontal overflow.

#### H4. Calendar optimizes for editing, not operating

**Evidence**
Every calendar event links to `/admin/events/[id]/edit`. Cards omit publication/registration state and event type. Calendar contains events only.

**Impact**
The administrator must leave calendar context to answer basic operational questions.

**Direction**
Open a preview drawer with status, registrations/capacity, time, type, and relevant quick actions, with a clear link to the Event Workspace.

#### H5. Search and filtering are absent

**Evidence**
Events, registrations, requests, interested contacts, and feedback all render their available rows without search controls. Current/previous/waitlist filtering occurs in page code after loading all registrations.

**Impact**
Visual scanning becomes the only retrieval method.

**Direction**
Implement server-side page search, filters, sort, count, and pagination first. Encode all state in URL query parameters.

#### H6. Notification, activity, and task concepts are not modeled

**Evidence**
There is no notification, activity, or admin-task table or UI. The global yellow reminder banner appears on every protected page regardless of context.

**Impact**
Important work is either invisible or repeated as a generic instruction.

**Direction**
Start with derived actionable tasks and recent activity on Overview. Add a notification inbox only when persistent unread state has a clear use.

#### H7. Interested contacts are framed as more event-specific than the data allows

**Evidence**
`AdminInterestedContact` contains contact, consent, unsubscribe, and timestamps only. No event, source, conversion, or engagement field exists.

**Impact**
Event filters, interest-to-registration conversion, and engagement views would fabricate relationships.

**Direction**
Move the page to Communications → Contacts. Show only consent-supported data and label future event-specific insights as requiring new collection.

### Medium

#### M1. Poster editing is duplicated

**Evidence**
The edit page renders `EventForm` and `EventPosterForm` (`app/(dashboard)/admin/(protected)/events/[id]/edit/page.tsx:21`). `EventForm` already contains a poster section (`features/admin/components/EventForm.tsx:248`), and `EventPosterForm` repeats it.

**Impact**
Two controls appear to manage the same property and duplicate input IDs on one page.

**Direction**
Keep one poster surface with add, replace, preview, and remove actions.

#### M2. Statuses are technically correct but visually fragmented

**Evidence**
A registered attendee may show three independent badges for booking, attendance response, and check-in.

**Impact**
The administrator must mentally compose the operational meaning.

**Direction**
Show one primary operational summary (“مسجلة — بانتظار التأكيد”) with expandable technical status details. Preserve separate data fields.

#### M3. Empty states explain but rarely help the next action

**Evidence**
The shared `EmptyState` supports title and description only. Messages is an instructional dead end; contacts and feedback do not link to the relevant public source or event workflow.

**Impact**
Empty screens feel complete visually but are not operationally helpful.

**Direction**
Allow one relevant primary action and an optional learn-more link. Do not add decorative filler.

#### M4. Unsaved-change protection is inconsistent

**Evidence**
`EventForm` warns on browser unload, while content, offers, and other editing surfaces do not share a common dirty-state pattern.

**Impact**
The admin may lose long edits when navigating between domains.

**Direction**
Provide a shared unsaved-change guard and sticky save state for substantial forms.

### Nice-to-have

#### N1. Global command search

High value after page-level search and indexes exist; premature before then.

#### N2. Saved views

For one administrator, shareable/bookmarkable URLs are sufficient initially. Saved filter objects add little value until repeated complex views emerge.

#### N3. Real-time updates

One administrator does not need subscription complexity initially. Fresh server reads, refresh feedback, and scoped optimistic updates are enough.

## 4. Proposed Admin Information Architecture

```text
Admin
├── نظرة عامة
├── التقويم
├── الفعاليات
│   ├── كل الفعاليات
│   ├── التقييمات (cross-event view)
│   └── مساحة الفعالية
│       ├── ملخص
│       ├── المسجلات
│       ├── قائمة الانتظار
│       ├── التواصل
│       ├── التقييمات
│       └── الإعدادات
├── التسجيلات
│   ├── القادمة
│   ├── الانتظار والدعوات
│   └── السابقة والملغاة
├── الطلبات
│   ├── الكل
│   ├── حجز المساحة
│   ├── إقامة الحفلات
│   └── طلبات الورش
├── التواصل
│   ├── قائمة الإرسال اليدوي
│   ├── جهات الاتصال
│   └── القوالب
└── الإعدادات والمحتوى
```

### Why this structure fits the actual product

- **Events** owns only records tied to an event.
- **Registrations** remains top-level because the admin sometimes needs cross-event retrieval, exports, and event-day oversight.
- **Requests** remains independent because booking/workshop applications can exist without an event.
- **Communications** owns the manual outbox, consented contacts, and templates; it does not pretend that manual opening equals delivery.
- **Feedback** is reachable both across events and inside an event. It does not need a sidebar entry.
- **Content** becomes part of Settings because it is low-frequency configuration, not daily operations.
- No Users domain is added because public accounts are explicitly excluded and only one administrator is approved.

## 5. Navigation Redesign

| Current top-level item | Proposed location | Change |
| --- | --- | --- |
| نظرة عامة | نظرة عامة | Keep; redesign as command center. |
| التقويم | التقويم | Keep; unify schedule sources. |
| الفعاليات | الفعاليات | Keep; rows open workspace instead of edit. |
| طلبات الحجز والورش | الطلبات | Keep, shorten label; use internal type/status tabs. |
| المسجلات الحاليات | التسجيلات → القادمة | Merge. |
| التسجيلات السابقة | التسجيلات → السابقة والملغاة | Merge. |
| قائمة الانتظار | التسجيلات → الانتظار والدعوات; also Event Workspace | Merge. |
| المهتمات | التواصل → جهات الاتصال | Move and rename based on actual data. |
| الرسائل | التواصل → قائمة الإرسال اليدوي | Replace empty page with an operational queue. |
| الاستبيانات | الفعاليات → التقييمات; also Event Workspace | Move to event context. |
| محتوى الموقع | الإعدادات والمحتوى | Rename and keep low-frequency. |

### Navigation behavior

- Desktop: persistent RTL sidebar, 7 items, active indicator, optional unresolved-task count only where meaningful.
- Laptop/tablet: compact rail or top-level sheet, but preserve page density; do not convert all tables to cards merely because the sidebar collapses.
- Mobile: bottom sheet with grouped domains, current item, and clear close behavior.
- Workspace: breadcrumb `الفعاليات / [اسم الفعالية]`, event header, then local tabs. The sidebar continues to mark “الفعاليات” active.
- Notification bell: do not add in the first redesign phase. Add only with the durable inbox described in section 13.

## 6. Overview Dashboard Redesign

### 6.1 Page order

1. **Command header**
   - Title: `نظرة عامة`
   - Current Riyadh date
   - Primary action: `فعالية جديدة`
   - Secondary: `بحث` when global search is available

2. **Operating ribbon — the visual signature**
   - A quiet horizontal “today → next event → next 7 days” strip.
   - It uses the existing amber rule as schedule structure, not decoration.
   - Shows one next event, time, capacity, and the single most important next action.

3. **Attention Queue (`يحتاج انتباهك`)**
   - New booking/workshop requests.
   - Events within 24 hours with unresolved manual reminders.
   - Events with a free seat and a waitlist.
   - Invites expiring soon.
   - Paid upcoming bookings still recorded as unpaid; explicitly exclude free bookings.
   - Schedule conflicts on active requests.
   - Drafts that cannot be published because required data is incomplete.

4. **Upcoming schedule**
   - Next 7 days in agenda form.
   - Events plus accepted/under-review space or celebration requests.
   - Each item links to its workspace or request detail.

5. **Operational metrics**
   - `فعاليات خلال ٣٠ يومًا`
   - `حجوزات فعّالة للفعاليات القادمة`
   - `طلبات جديدة`
   - `مقاعد متبقية في أقرب الفعاليات`
   - Definitions appear in tooltips/help text. Do not show “new users” or ambiguous “active events.”

6. **Recent activity**
   - Grouped by day and, where helpful, by event.
   - Examples supported by current timestamps: new event registration, new request, new consented contact, submitted feedback.
   - No read/unread state; activity is history.

7. **Capacity watch**
   - Only upcoming published events, ordered by date or capacity risk.
   - No archived or past events by default.

### 6.2 Concept wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ نظرة عامة                       [فعالية جديدة] [بحث]         │
│ الخميس، ٢٠ أغسطس ٢٠٢٦                                      │
├──────────────────────────────────────────────────────────────┤
│ اليوم ───── الفعالية التالية: … ───── خلال ٧ أيام: …        │
├───────────────────────────┬──────────────────────────────────┤
│ يحتاج انتباهك             │ الجدول القادم                   │
│ 3 طلبات جديدة             │ ٦:٠٠ م  فعالية …               │
│ 1 تذكير مستحق             │ غدًا     طلب حجز …              │
│ 2 مقعد + قائمة انتظار     │ …                                │
├───────────────────────────┴──────────────────────────────────┤
│ مؤشرات تشغيلية محددة التعريف                              │
├───────────────────────────┬──────────────────────────────────┤
│ آخر النشاط                │ متابعة السعة                    │
└───────────────────────────┴──────────────────────────────────┘
```

### 6.3 Dashboard data strategy

P0 should derive tasks from current state with scoped aggregate queries. A durable `admin_tasks` table is justified only for tasks that need snooze/dismiss/manual assignment. A full activity table is not required for the initial feed because current entities already have creation/submission timestamps; activity involving state changes or actor attribution requires an audit model later.

## 7. Event Management Redesign

### 7.1 Events list

Default view: upcoming and active operational events.

Controls:

- Search by event title/type.
- Status filters: `قادمة`, `مسودات`, `منتهية`, `ملغاة`, `مؤرشفة`.
- Audience and event-kind filters.
- Sort by nearest date, newest created, capacity risk.
- URL query state for every filter and page.

Row content:

- Event title and kind.
- Date/time.
- Publication/lifecycle status.
- Registration open/closed.
- Reservations/capacity with a compact progress bar.
- One next action.
- More menu for edit, preview, duplicate, archive.

Row click opens the Event Workspace. `تعديل` should no longer be the only useful destination.

### 7.2 Event create/edit

Do not convert the current form into a multi-step wizard. The field count is manageable, and a wizard would hide context and add transitions.

Use one grouped page with:

- Basic information.
- Schedule.
- Audience.
- Capacity, price, and registration control.
- Venue only after the event model supports a reliable value.
- One poster control.
- Sticky save bar with dirty/saved/error state.
- Separate `حفظ المسودة` and lifecycle-aware `مراجعة ونشر` actions.

### 7.3 Lifecycle

```text
draft → published → cancelled → archived
   └──────────────→ archived
```

- Cancellation is retained and operationally meaningful.
- Archive removes an item from active work but is not a substitute for cancellation.
- No hard delete for events with operational history.
- Registration open/closed stays separate from publication and cancellation.

## 8. Event Workspace Specification

Route proposal: `/admin/events/[id]`

### 8.1 Workspace shell

Persistent header:

- Event title.
- Date/time and event kind.
- Lifecycle, registration, and capacity summary.
- Primary lifecycle-aware action.
- Secondary `تعديل`.
- More menu.

```text
الفعاليات / [اسم الفعالية]

[اسم الفعالية]       [منشورة] [التسجيل مفتوح]     [إدارة المسجلات]
الخميس، ٦–٨ م · 8/15 مقعدًا                         [تعديل] [المزيد]

ملخص | المسجلات | قائمة الانتظار | التواصل | التقييمات | الإعدادات
```

Tabs are links, not client-only state, so they are deep-linkable and browser navigation works.

### 8.2 ملخص

**Purpose**: answer what is happening and what the admin should do next.

**Important data**: schedule, status, capacity, paid/unpaid summary for paid events, attendance confirmations, check-in state, waitlist count, communication status, latest feedback summary after the event.

**Primary action**: lifecycle-aware — publish, manage registrations, start check-in, or review feedback.

**Secondary actions**: preview public page, close/reopen registration, edit.

**Filters**: none; this is a summary.

**Bulk actions**: none.

### 8.3 المسجلات

**Purpose**: operate this event’s registered attendees without leaving the event.

**Important data**: attendee/guardian summary, booking time, contact, booking state, attendance response, check-in, payment for paid events.

**Primary action**: `مراسلة المحددات` when selected; otherwise contextual row action.

**Secondary actions**: export, open detail drawer, confirm attendance, record payment.

**Filters**: search, attendance response, check-in, payment (paid events only), booking date.

**Bulk actions**: message, export; payment update only in a later safeguarded phase.

**Navigation**: row detail opens a drawer and retains table filters/scroll.

### 8.4 قائمة الانتظار

**Purpose**: preserve registration order and make manual replacement safe.

**Important data**: position, registered-at time, invitation state/expiry, contact, available seats.

**Primary action**: invite the next eligible person only when capacity allows.

**Secondary actions**: revoke invitation, open details, cancel waitlist entry with confirmation.

**Filters**: waitlisted/invited/expired; search.

**Bulk actions**: export only. No bulk invite and no automatic promotion.

**Navigation**: cancelling a registered attendee should surface an inline task linking directly here.

### 8.5 التواصل

**Purpose**: manage communication for this event.

**Important data**: purpose, recipient cohort, channel, prepared/sent/delivered truth level, failed/skipped items, last action.

**Primary action**: `رسالة جديدة`.

**Secondary actions**: continue manual queue, preview template, view history.

**Filters**: purpose, channel, state, recipient.

**Bulk actions**: create queue from selected registrations; never mark delivered in bulk for manual WhatsApp.

### 8.6 التقييمات

**Purpose**: issue feedback links and understand submitted event feedback.

**Important data**: invitations prepared/sent, response count, average hospitality/material ratings, suggestions, identity-visible label.

**Primary action**: `طلب تقييم` for eligible attendees through the communication workflow.

**Secondary actions**: export anonymous/authorized data, open response detail.

**Filters**: submitted/not submitted, rating, identity visible/anonymous.

**Bulk actions**: prepare feedback requests; export.

### 8.7 الإعدادات

**Purpose**: configure the event without mixing settings with daily operations.

**Important data**: approved event fields, poster, registration control, lifecycle history.

**Primary action**: `حفظ التعديلات`.

**Secondary actions**: replace/remove poster, preview public page, duplicate event.

**Danger zone**: cancel event; archive event. No hard delete.

### 8.8 Explicit exclusions from Event Workspace

- Interested contacts: global consent records, no `event_id`.
- Workshop applications: independent service requests.
- Space/celebration booking requests: independent requests that can conflict with events but are not children of events.
- Generic analytics unrelated to the selected event.

## 9. Calendar Redesign

### 9.1 Views

- **Month**: default desktop view for planning and date distribution.
- **Agenda**: default mobile view and a fast chronological list.
- **Week**: valuable for time conflicts once booking requests are included; implement after the unified calendar read model.
- **Day**: do not build now. Current event density does not justify it.

### 9.2 Calendar sources

- Events: draft, published, cancelled, archived only when explicitly filtered.
- Space/celebration requests: new, under review, accepted; rejected/cancelled hidden by default.
- Workshop applications: excluded because they have no requested schedule.

### 9.3 Event representation

Show only information that supports a planning decision:

- Title.
- Time.
- Type icon/label: event, Bayn trip, space booking, celebration booking.
- Lifecycle/request status.
- Registrations/capacity for events.
- Conflict indicator.
- Location only after reliable event/default venue data exists.

### 9.4 Click behavior

Strongest pattern: a deep-linkable preview drawer using URL state such as `?event=<id>` or `?request=<id>`.

Drawer actions:

- Open Event Workspace / request detail.
- Edit.
- View registrations for events.
- View conflict detail for requests.

On narrow mobile screens, use a full-height sheet or navigate to the detail page. Do not render an undersized modal.

### 9.5 Filters

- Source/type.
- Status.
- Audience for events.
- Show archived/cancelled.
- Conflicts only.

All filters persist in the URL.

## 10. Registration Management

Route proposal: `/admin/registrations?view=upcoming|waitlist|previous`

### Recommended desktop structure

- Top segmented navigation for `القادمة`, `الانتظار والدعوات`, `السابقة والملغاة`.
- Search and filters in one compact toolbar.
- Dense table with sticky header and selection column.
- Row click opens detail drawer.
- Contextual action column with one primary action and More menu.

### Recommended columns

1. Selection.
2. Attendee/guardian summary.
3. Event and date.
4. Primary operational status.
5. Registered-at time.
6. Contact shortcut.
7. Payment only when applicable.
8. Next action.

Reference, email, full state detail, and destructive actions move to the drawer to reduce width.

### Search, filters, sorting

- Search: attendee name, guardian name, exact/partial Saudi mobile, email, public reference.
- Filters: event, booking state, attendance response, check-in, payment, event date range.
- Sort: booking time, event start, attendee name, waitlist order.

### Event-day check-in mode

Add a focused mode inside the Event Workspace:

- Large search field.
- Attendee name and confirmation state.
- One-tap `تم الحضور`.
- Confirmed visible feedback.
- Absence remains a confirmed secondary action.
- No unrelated payment/reminder controls in this mode.

## 11. Interested Users Redesign

Rename the concept to `جهات الاتصال` because current records are consented contacts for future-event communication, not event interest records.

### Current-data experience

- Active consent count.
- New contacts in the selected date range.
- Unsubscribed count.
- Search by name, phone, email.
- Filter by consent state and date.
- Export filtered results with consent state.
- Contact detail drawer with minimum required data.

### Do not show yet

- Event filter.
- Source breakdown.
- Interest-to-registration conversion.
- Email open/click engagement.
- “Most interested events.”

These require new event/source attribution or provider delivery data.

### Empty state

Explain that contacts appear only after explicit future-event consent, link to the public consent form for inspection, and provide no fake sample rows.

### Channel boundary

The current consent must not automatically be interpreted as WhatsApp marketing consent. Until the owner approves channel wording, a business number, and policy implications, use these records only for the approved contact workflow and future verified email implementation.

## 12. Communication System

### 12.1 Recommended channel strategy

| Option | Recommendation | Reason |
| --- | --- | --- |
| Individual prepared WhatsApp links | Keep as the transport for launch | Approved, low infrastructure, human remains in control. |
| Batch workflow | Build as **batch preparation + sequential manual sending**, not automatic batch transmission | Reduces repeated setup while respecting browser and platform constraints. |
| WhatsApp Business Platform/API | Future, blocked by approved open decisions | Requires business number/provider, cost/privacy review, opt-in/policy review, approved templates, webhooks, and delivery handling. |
| Unofficial browser automation/extensions | Reject | Fragile, policy/security risk, no reliable delivery truth. |

Modern browsers require a separate user gesture for each new `window.open()` and may block attempts to open many tabs. The interface must therefore open one WhatsApp destination at a time, not promise “send all.” See [MDN `window.open()` guidance](https://developer.mozilla.org/en-US/docs/Web/API/Window/open). WhatsApp also applies business messaging policies, opt-in expectations, template review for business-initiated platform messages, and enforcement; see the [WhatsApp Business Messaging Policy](https://whatsappbusiness.com/policy/) and [official developer hub](https://whatsappbusiness.com/developers/developer-hub/).

### 12.2 Manual outbox flow

```text
Select recipients
→ Choose purpose/template
→ Validate eligibility and secure variables
→ Preview recipient count + one personalized sample
→ Create manual queue
→ Open WhatsApp for recipient 1
→ Return and mark “sent manually” or “skip”
→ Continue to recipient 2
```

The queue must preserve progress when the administrator leaves and returns.

Truthful manual states:

- `prepared`
- `opened_externally`
- `marked_sent_manually`
- `skipped`
- `invalid_recipient`

Never label a manual message `delivered` or `read`.

### 12.3 Recipient selection

- Start from event registrations, waitlist, contacts, or a filtered global registration list.
- Show selected count and excluded recipients.
- Exclusion reasons: cancelled registration, missing/invalid channel, no applicable consent for marketing, expired/ineligible secure link.
- Secure management/invitation/feedback links should be generated just in time and stored only as hashes as required by the current security model.

### 12.4 Email

Resend remains the approved provider after domain verification. Until then:

- Show email as unavailable with its documented blocker.
- Do not add a fake send button.
- Design the outbox so email can later share recipient selection, template rendering, idempotency, and delivery history.

When enabled, email sending needs a durable delivery-attempt model with purpose, template version, idempotency key, provider message ID, status, timestamps, and privacy-filtered errors.

### 12.5 Templates

Recommendation: **global defaults plus sparse event-specific overrides**.

- Global template defines the approved baseline for a channel and purpose.
- An event may override copy explicitly; it does not silently fork every template.
- The editor shows variable chips, validation, preview, and `استعادة النص الافتراضي`.
- Restoring a default removes the override; it does not rewrite history.
- Send attempts retain the rendered content/template version needed for audit without logging secrets.

Reliable variables today:

- Participant name.
- Event name.
- Event start/end date and time.
- Price captured at booking.
- Secure booking-management URL.
- Secure waitlist invitation URL.
- Secure feedback URL.

Conditional variable:

- Venue only after the event/default venue model is reliable.

Do not expose arbitrary template syntax. Offer approved variable buttons and reject missing required secure variables server-side.

### 12.6 Template purposes

- Registration confirmation.
- 24-hour reminder.
- 3-hour reminder.
- Event update.
- Event cancellation.
- Waitlist invitation.
- Feedback request.
- Custom operational message, with no automatic marketing interpretation.

## 13. Notification System

### 13.1 Separate the concepts

| Concept | Meaning | State | Surface |
| --- | --- | --- | --- |
| Admin task | Work that requires action | open, resolved; later snoozed/dismissed if approved | Overview Attention Queue; optional domain badge |
| Notification | Time-sensitive information the admin should notice | unread/read, grouped | Future inbox/bell |
| Activity | Historical fact about what happened | immutable; no unread | Overview feed and contextual history |
| Toast | Feedback for the admin’s own immediate action | transient | Current page only |

### 13.2 Phase recommendation

**P0/P1**: Attention Queue + Recent Activity, no bell.

**P2/P3**: Add a notification bell/inbox only if the admin needs persistent cross-page awareness after the task feed is operating.

### 13.3 Notification categories

- Requests.
- Registrations and cancellations.
- Waitlist/invitation expiry.
- Schedule/conflicts.
- Communications/delivery failures.
- System/security only when actionable.

### 13.4 Priority

- **Urgent**: affects an event today, an invitation about to expire, or a blocking conflict.
- **Needs action**: new request, available seat with waitlist, due reminder.
- **Informational**: new registration, new contact, submitted feedback.

Priority is system-defined from approved rules; do not make the admin triage arbitrary severity settings.

### 13.5 Grouping and destinations

- Group repeated registrations by event and short time window.
- “5 new registrations for [event]” opens that workspace’s Registrations tab with the relevant date filter.
- New request opens the request detail.
- Waitlist task opens the selected event’s Waitlist tab.
- Communication failure opens the exact outbox batch.

### 13.6 Admin email notifications

Do not send an email for every event registration by default. If the owner later wants admin email alerts, offer a digest or priority-only mode after sender verification.

## 14. Bulk Actions

| Domain | Recommended bulk actions | Explicitly avoid |
| --- | --- | --- |
| Event registrations | Message selected, prepare feedback request, export selected/filter results | Bulk cancellation, bulk absence, silent state changes |
| Waitlist | Export | Bulk invite, automatic replacement |
| Interested contacts | Export; email selected only after provider/consent readiness | WhatsApp marketing without approved consent; silent resubscribe |
| Requests | Export selected; later assign internal review state if multiple admins are approved | Bulk accept/reject/payment changes |
| Events | Export list; possibly archive eligible past drafts in a future phase | Bulk publish, cancel, or hard delete |
| Feedback | Export filtered authorized responses | Changing identity visibility |

### Safeguards

- Persistent selection bar with exact count.
- Distinguish `تحديد هذه الصفحة` from `تحديد كل النتائج`.
- Preview recipients/records before action.
- Explain exclusions and partial failures.
- Use idempotency for every batch-created message attempt.
- Keep destructive bulk actions out of scope unless a proven workflow requires them.
- Reset or explicitly retain selection when filters change; never silently act on hidden rows.

## 15. Search & Filtering Strategy

### 15.1 Page search first

Implement page-level server search in this order:

1. Registrations.
2. Requests.
3. Events.
4. Contacts.
5. Feedback.

Use Next.js App Router `searchParams` in Server Component pages and preserve query state in links. This matches the installed Next.js 16 model and requires no new state library. Context7 source: `/vercel/next.js/v16.2.9`, topics `searchParams`, `useSearchParams`, and URL filter state.

### 15.2 Global search

Build in P2 after page search is stable.

Search targets:

- Event title.
- Attendee/guardian name.
- Saudi mobile.
- Email.
- Registration public reference.
- Request public reference/title/requester.
- Workshop application title/presenter.

Result groups: `فعاليات`, `تسجيلات`, `طلبات`, `جهات اتصال`.

Behavior:

- Header search button plus `⌘/Ctrl + K` shortcut.
- Search is navigation-first, not a mutation command palette in the initial version.
- Results show minimum necessary personal data.
- Query handled server-side after `requireAdmin()`; never place personal data in analytics or logs.
- No external search service.

### 15.3 Query strategy

Current repositories often load all rows then filter in application code. Replace this with scoped repository methods that filter/order/count/paginate in Postgres. Supabase supports `.order()`, `.range()`, explicit filters, and exact head counts. Context7 source: `/supabase/supabase`, topic `supabase-js server-side filtering, ordering, counts, and range pagination`.

### 15.4 Saved filters

Do not build saved-filter persistence initially. URL-backed filters can be bookmarked and shared, which is sufficient for one administrator.

## 16. Event Settings & Advanced Actions

### Action hierarchy

#### Primary action

Only one, based on lifecycle and time:

- Draft: `مراجعة ونشر`.
- Upcoming published: `إدارة المسجلات`.
- Event day: `بدء تسجيل الحضور`.
- Past: `مراجعة التقييمات`.

#### Secondary actions

- Edit event.
- Preview public page.
- Close/reopen registration.

#### More menu

- Duplicate event.
- Export event data.
- Replace/remove poster.
- Archive where eligible.
- View event history.

#### Danger zone

- Cancel event.
- Archive a currently active event with clear consequences.

No hard delete.

### Safeguard patterns

- Publish: readiness summary and public-preview link.
- Close/reopen registration: reversible; confirm via toast and optional undo, not a heavy modal.
- Archive: confirmation that it leaves active operations/public discovery.
- Cancel event: affected-recipient count, explicit confirmation, resulting communication tasks, and no implied delivery.
- Duplicate: create a draft only; never copy registrations, reminders, feedback, secure tokens, or message history.
- Poster remove: confirmation and storage cleanup; public fallback remains coherent.

## 17. UX Improvements Not Mentioned in the Brief

### 17.1 Event-day mode

The highest-pressure admin moment is likely arrival/check-in. A focused check-in mode removes all unrelated controls and optimizes for fast name/phone lookup and clear tap targets.

### 17.2 Operational status summaries

Keep the approved separate status fields in data, but compute a readable primary status for lists. Example: `مسجلة · أكدت الحضور · لم تصل بعد`. This reduces mental composition without collapsing the underlying model.

### 17.3 Context-preserving drawers and return state

Opening and closing a record must preserve filters, page, selection, and scroll. Deep-link drawers allow browser Back and copied URLs to behave correctly.

### 17.4 Readiness and handoff tasks

Use deterministic task handoffs:

- Registration cancelled → show “seat available” task if waitlist exists.
- Event date changes → show reconfirmation/communication task.
- Event ends → show feedback-request task.
- Offer accepted → show payment-recording task if applicable.

These are more useful than generic notifications because they connect a state change to the next operation.

### 17.5 Data freshness without real-time complexity

Show a small last-refreshed timestamp and explicit refresh on queue-heavy pages. Use optimistic UI only for local, reversible operations. Do not add Supabase Realtime until concurrent administrators make it necessary.

### 17.6 Visual direction

Preserve the existing identity rather than importing a generic SaaS dashboard aesthetic.

- **Palette**: Forest `#204F28`, Olive `#708A58`, Amber `#FFB623`, Cream `#FFF1CA`, Surface `#FFFEF8`, Error `#9E2F24`.
- **Typography**: retain Thmanyah Sans; use black/bold for page/event titles, regular/medium for operations, and tabular numerals for counts/time comparison.
- **Layout**: quiet surfaces, compact operational rows, amber rules only where they encode schedule or current position.
- **Signature**: the Overview operating ribbon, derived from the club’s schedule rather than decorative dashboard cards.
- **Motion**: short opacity/transform transitions for drawers/toasts only; honor reduced motion.

The deliberate design risk is replacing the expected KPI-card hero with an operational time ribbon. It is specific to a cultural events operator and makes time—not vanity metrics—the organizing device.

## 18. Current Flow vs Proposed Flow

### 18.1 Reach one event’s registrations

**Current**
`الفعاليات → تذكّر اسم الفعالية → المسجلات الحاليات → امسح قائمة متعددة الفعاليات`

**Proposed**
`الفعاليات → مساحة الفعالية → المسجلات`

**Improvement**: one stable event context, no repeated event filtering or recall.

### 18.2 Calendar to event operations

**Current**
`التقويم → الفعالية → تعديل → القائمة الجانبية → التسجيلات → ابحث بصريًا`

**Proposed**
`التقويم → معاينة جانبية → مساحة الفعالية/المسجلات`

**Improvement**: calendar context is preserved; the first click gives operational facts rather than forcing edit mode.

### 18.3 Cancel a registration and fill the seat

**Current**
`المسجلات الحاليات → إلغاء → قائمة الانتظار → ابحث عن الفعالية → إصدار دعوة → WhatsApp`

**Proposed**
`مساحة الفعالية/المسجلات → إلغاء → مهمة “مقعد متاح” → دعوة التالية → WhatsApp`

**Improvement**: one workspace, explicit handoff, preserved waitlist order.

### 18.4 Send reminders to multiple attendees

**Current**
`المسجلات الحاليات → لكل صف: تجهيز → فتح WhatsApp → رجوع → تعليم كمرسل`

**Proposed**
`مساحة الفعالية/التواصل → تحديد المستلمات → اختيار تذكير → معاينة → قائمة إرسال متتابعة`

**Improvement**: recipient and template setup happens once. Manual WhatsApp still requires one explicit user gesture per recipient; the redesign does not promise impossible “send all.”

### 18.5 Review new requests

**Current**
`الطلبات → تمرير بطاقات كاملة → العثور على جديد → قراءة/تعديل داخل البطاقة الطويلة`

**Proposed**
`الطلبات → مرشح “جديد” → صف الطلب → درج التفاصيل/العرض`

**Improvement**: scan first, disclose detail second, retain queue position.

### 18.6 Find a registration by phone/reference

**Current**
`اختر الحالية أو السابقة أو الانتظار → امسح القائمة بصريًا → جرّب صفحة أخرى`

**Proposed**
`التسجيلات → بحث واحد → افتح التفاصيل`

**Improvement**: one query across lifecycle states.

### 18.7 Request event feedback

**Current**
`التسجيلات السابقة → لكل مشاركة تجهيز الرابط → WhatsApp → الاستبيانات لمراجعة الردود`

**Proposed**
`مساحة الفعالية/التواصل → تحديد الحاضرات → طلب تقييم → مساحة الفعالية/التقييمات`

**Improvement**: request and results remain attached to the event.

## 19. Technical Impact

Effort ratings are relative to this repository, not calendar estimates.

| Recommendation | Frontend | Backend/domain | Database/migration | API/query | Real-time | New service/dependency | Security |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IA/navigation consolidation | Small | None | None | None | None | None | Preserve `requireAdmin()` on every route. |
| Event Workspace shell | Large | Medium | None initially | Add event-scoped repository methods | None | None | Event ID authorization remains server-enforced. |
| Unified registrations | Large | Medium | Small indexes possible | Server filtering/count/pagination | None | None | Minimize PII in list/search responses. |
| Request master-detail | Medium | Medium | Small/index or batched conflict function | Remove N+1 conflict lookup | None | None | Drawer mutations remain server actions with MFA. |
| Unified calendar | Medium | Medium | None to Small | Unified schedule query/read model | None | None | Do not expose internal calendar publicly. |
| Overview attention queue | Medium | Medium | None/Small for initial derived tasks | Aggregate scoped queries | None | None | Avoid PII in activity summaries. |
| Recent activity feed | Medium | Medium | None for created/submitted activity; Medium for durable audit | Union/aggregate query | Optional later | None | Define retention; no secret/token payloads. |
| Manual WhatsApp outbox | Large | Large | Medium | Queue/item actions + idempotency | None | None | Hash secure tokens; truthful manual states; recipient authorization. |
| Editable templates | Medium | Medium | Medium | Render/validate/version actions | None | None | Approved variables only; no secret logging. |
| Verified transactional email | Medium | Large | Medium | Provider adapter, webhooks, retries | Webhooks, not UI real-time | Resend already approved; blocked by domain | Signature verification, idempotency, privacy filters. |
| Full notification inbox/bell | Medium | Large | Large | Read/group/resolve endpoints | Optional | None | Per-admin visibility and retention. |
| Page search/filter/pagination | Medium | Medium | Small/Medium indexes | Replace full-table reads | None | None | `requireAdmin()`, no query logging of PII. |
| Global search | Medium | Medium/Large | Medium indexes | Scoped multi-entity search | None | None | Minimum-data results; rate limit if needed. |
| Event cancellation | Medium | Large | Medium forward migration | Lifecycle RPC/actions + communication handoff | None | Email/WhatsApp adapter as available | Confirmation, affected-recipient preview, audit. |
| Poster remove/deduplication | Small | Small | None | Storage/repository remove action | None | None | Validate path ownership; clean storage safely. |
| Responsive/admin accessibility refinement | Medium | None | None | None | None | None | Keyboard, focus, RTL, reduced motion. |
| Analytics supported by current data | Medium | Medium | Small indexes/views | Aggregate queries | None | None | Aggregate/anonymous where possible. |

### Current query risks to correct

- Registrations currently load registrations, all events, and all reminders, then filter in page code (`lib/supabase/registrations.ts:201`).
- Feedback loads all submitted links, all event titles, and all attendee names before mapping (`lib/supabase/event-feedback.ts:48`).
- Requests call conflict lookup per booking request (`app/(dashboard)/admin/(protected)/requests/page.tsx:22`).
- Interested contacts load all rows with no pagination (`lib/supabase/interested-contacts.ts:67`).

These are acceptable at the current tiny dataset but are the wrong foundation for search, dashboards, and bulk operations.

### Dependency position

No new frontend dependency is required for the core redesign. Next.js App Router, Server Components/Actions, URL search parameters, React, Tailwind, and Supabase are sufficient. Evaluate a new dependency only when a concrete component cannot be safely maintained with the existing stack.

## 20. Implementation Priorities

### P0 — Foundation / Critical

- Approve the proposed IA and event boundary.
- Define canonical Arabic status/action vocabulary.
- Correct event cancellation lifecycle mismatch before exposing cancellation UX.
- Create scoped query contracts for event workspace, registration filters, dashboard tasks, and schedule sources.
- Consolidate navigation and active-state behavior.
- Fix responsive density/page-level overflow and duplicated poster controls.
- Define truthful communication state semantics.

### P1 — Major UX improvements

- Event Workspace shell, Overview, Registrations, Waitlist, Settings.
- Unified global Registrations page.
- Request master-detail experience and batched conflicts.
- Overview Attention Queue and upcoming schedule.
- Calendar preview drawer and event-workspace linking.
- Event-day check-in mode.
- Manual WhatsApp outbox for event registrations.

### P2 — Productivity improvements

- Page-level search, filters, sorting, pagination.
- Event Communications and Feedback tabs.
- Global Contacts redesign.
- Global default templates + event overrides.
- Global search.
- Supported operational analytics.
- Limited safe bulk actions.

### P3 — Advanced / future

- Durable notification inbox/bell.
- Admin notification preferences/digests.
- Verified transactional email after domain setup.
- Official WhatsApp Business Platform after provider/number/cost/consent approval.
- Saved views when repeated complex filters justify them.
- Real-time updates if multiple concurrent administrators are approved.

## 21. Recommended Implementation Phases

No phase begins until this plan and its product decisions are approved.

### Phase 1 — Information architecture and operational foundations

**Goal**
Create a coherent admin shell and correct foundations without changing business behavior.

**Changes**

- Reduce top-level navigation.
- Add active route state and workspace breadcrumb/tabs primitives.
- Define status summaries, attention-task definitions, URL filter conventions.
- Create scoped repository contracts; keep existing screens operational during transition.
- Fix event edit poster duplication and responsive layout overflow/density.

**Affected files/modules**

- `lib/navigation.ts`
- `components/layout/AdminSidebar.tsx`
- `components/layout/AdminHeader.tsx`
- `components/navigation/AdminMobileNavigation.tsx`
- `app/(dashboard)/admin/(protected)/layout.tsx`
- `components/ui/*`
- `app/globals.css`
- `lib/data/contracts.ts`
- admin Supabase repositories

**Dependencies**: approved IA and vocabulary.

**Risks**: broken old links; route transition confusion.

**Acceptance criteria**

- Every existing route has a redirect or remains available during migration.
- Current domain is visible in desktop/mobile navigation.
- No page-level horizontal overflow at representative widths.
- Existing mutations retain `requireAdmin()` and RLS protection.

### Phase 2 — Event Workspace and registrations

**Goal**
Keep event-related operations in one context.

**Changes**

- Add `/admin/events/[id]` workspace shell.
- Add Overview, Registrations, Waitlist, Settings.
- Unify global registration lifecycle views.
- Add row-detail drawer and event-day check-in mode.
- Implement event-scoped server filtering/export.

**Affected files/modules**

- New `app/(dashboard)/admin/(protected)/events/[id]/*`
- Existing event edit route/actions
- Registration routes/actions/export
- `features/admin/components/RegistrationTable.tsx`
- New `features/admin/event-workspace/*`
- `lib/supabase/events.ts`
- `lib/supabase/registrations.ts`
- domain contracts/tests

**Dependencies**: Phase 1; approved event cancellation plan for lifecycle surfaces.

**Risks**: duplicate old/new views; stale filters; accidental status conflation.

**Acceptance criteria**

- Event registrations reachable from Events in no more than 2 interactions.
- Waitlist operations stay in the selected event context.
- Separate booking/attendance/check-in/payment fields remain intact.
- No bulk automatic waitlist promotion.

### Phase 3 — Requests, calendar, and command center

**Goal**
Make incoming work and schedule conflicts visible and scannable.

**Changes**

- Request list/detail drawer with type/status filters.
- Batched conflict retrieval.
- Unified calendar sources and preview drawer.
- Overview Attention Queue, upcoming schedule, corrected KPIs, recent activity.

**Affected files/modules**

- Requests page/actions/components/repository
- Calendar page and `CalendarMonthGrid.tsx` replacement/refactor
- `AdminOverview.tsx`
- events/requests aggregation queries or RPCs
- relevant database indexes/migrations if query review requires them

**Dependencies**: Phases 1–2; approved attention priority definitions.

**Risks**: expensive aggregate queries; ambiguous request/calendar states.

**Acceptance criteria**

- New requests visible from Overview and Requests without scanning expanded cards.
- Calendar shows approved schedule sources and excludes unscheduled workshop applications.
- Archived/past events do not dominate Overview.
- No N+1 conflict lookup.

### Phase 4 — Communications and contacts

**Goal**
Reduce repetitive messaging while preserving manual-channel truth and consent boundaries.

**Changes**

- Manual outbox batches/items/progress.
- Recipient selection and preview.
- Event Communications tab.
- Contacts page under Communications.
- Global templates and approved event overrides.
- Move feedback requests into the communication flow.

**Affected files/modules**

- Replace current Messages page
- Registration reminder/invite/feedback components
- `lib/messaging/*`
- new provider-neutral communication contracts
- forward database migrations for queue/template records
- SQL/RLS tests

**Dependencies**: approved template and contact-channel decisions; no automated WhatsApp provider needed for manual queue.

**Risks**: overstating delivery; generating links too early; consent misuse; partial batch failure.

**Acceptance criteria**

- Recipient cohort is previewed before queue creation.
- One explicit gesture opens one WhatsApp recipient.
- Progress survives navigation/reload.
- Manual state never claims delivered/read.
- No personal data or secure tokens in logs.

### Phase 5 — Search, analytics, and optional notifications

**Goal**
Improve retrieval and oversight after core workflows are coherent.

**Changes**

- Page search/filter/pagination.
- Global navigation search.
- Event/admin analytics supported by current data.
- Evaluate durable notification inbox after measuring Attention Queue use.

**Affected files/modules**

- Admin list pages and repositories
- database indexes/views/RPCs
- optional search route/server action
- optional notification schema/components

**Dependencies**: stable scoped queries; evidence that a notification inbox adds value.

**Risks**: PII exposure in results/logs; expensive wildcard search; vanity metrics.

**Acceptance criteria**

- Search returns authorized results without full-table client filtering.
- Filters and pagination are URL-backed.
- Analytics definitions are visible and traceable to real data.
- Notification badge, if built, counts unresolved actionable items rather than activity noise.

### Phase 6 — Responsive, accessibility, and acceptance polish

**Goal**
Verify complete real-world flows in Arabic RTL.

**Changes**

- Loading/skeleton, empty, error, success, undo, and unsaved-change states.
- Keyboard/focus audit.
- Mobile/tablet/master-detail refinement.
- Performance and privacy review.

**Affected files/modules**: all changed admin routes/components and tests.

**Dependencies**: completed functional phases and protected preview data.

**Risks**: hidden overflow, focus loss in drawers, long Arabic content, action-state mismatch.

**Acceptance criteria**: section 22 plus repository validation requirements.

## 22. UX Acceptance Criteria

1. Admin can reach any event’s registrations from Events in `≤ 2` interactions.
2. Calendar selection reveals event status, time, registrations/capacity, and a workspace link without entering edit mode.
3. Event-linked registrations, waitlist, communication, feedback, and settings are reachable without leaving the Event Workspace.
4. Registration search covers current, waitlist/invited, past, and cancelled records from one page.
5. Page filters, sort, pagination, workspace tabs, and open drawer identity are reflected in the URL where practical.
6. Overview shows unresolved work before non-actionable totals.
7. Payment attention excludes free event registrations.
8. Archived and past events are not shown in default Overview capacity monitoring.
9. Admin can create one reminder batch for selected attendees without copying a phone number or rewriting a message.
10. Manual WhatsApp opens one recipient per explicit gesture; the UI never attempts unlimited tabs.
11. Manual messages use `prepared/opened/marked sent` truth and never claim provider delivery.
12. Cancelling a registration with a waiting list produces a clear next-step task in the same event context.
13. Waitlist order is visible and no bulk/automatic replacement exists.
14. Destructive actions show the target, consequence, and affected count where applicable.
15. Event hard delete is unavailable; cancellation and archive remain distinct.
16. Request list is scannable without rendering every offer editor at once.
17. No request conflict query runs once per rendered card.
18. Current navigation item is visually and semantically identified.
19. No page-level horizontal scroll at `320×568`, `390×844`, `768×1024`, `1024×768`, or `1440×900`.
20. Operational tables remain dense at laptop/tablet widths and convert to cards only where narrow-phone readability requires it.
21. All interactions are keyboard operable with visible focus, correct focus return, and Arabic accessible names.
22. Drawers/sheets trap or manage focus correctly, close with Escape, and preserve the underlying list state.
23. Loading, empty, error, success, and partial-batch states are written in Arabic and provide a next step.
24. No public-account, event-interest, source, engagement, or venue data is fabricated.
25. No personal data, secure token, full message body, or search query containing PII is written to logs/monitoring.
26. All admin reads/mutations remain protected by `requireAdmin()`, MFA, RLS, and explicit database authorization.

## 23. Things We Should NOT Build

1. **A top-level page for every record subtype.** It recreates the current fragmentation.
2. **Workshops, booking requests, or interested contacts inside Event Workspace.** No event relationship exists.
3. **“New user” notifications or user management.** Public accounts are explicitly excluded.
4. **A notification bell that duplicates activity.** Build only after defining persistent notification value.
5. **Automatic multi-tab WhatsApp sending.** Browsers require separate user gestures and block popup spam.
6. **Unofficial WhatsApp automation, extensions, scraping, or simulated clicks.** It is fragile and introduces security/platform risk.
7. **WhatsApp Business API before provider/number/cost/privacy/template approval.** It is an approved deferred decision, not a visual toggle.
8. **Hard delete or bulk cancel for events/registrations.** Operational history and linked records require retained state and safeguards.
9. **Bulk waitlist invitation or automatic promotion.** Conflicts with approved manual order and capacity rules.
10. **A wizard for the current event form.** It adds transitions without enough field complexity to justify them.
11. **All actions inline in every table row.** Use contextual primary action, drawer, More menu, and danger zone.
12. **Saved filters before URL-backed filters are proven insufficient.** One admin can bookmark URLs.
13. **Day calendar view now.** Current density does not justify its cost.
14. **Real-time subscriptions by default.** One administrator and request-time server data do not need it.
15. **Engagement/conversion analytics without event/source/delivery data.** No inferred relationships.
16. **A third-party search service.** Current scale and privacy needs favor Postgres-backed scoped search.
17. **Arbitrary template code or unvalidated variables.** Only reliable, server-rendered variables should be available.
18. **Decorative dashboards full of equal KPI cards.** The command center should organize work by urgency and time.

## 24. Approved Decisions and Remaining Inputs

The six redesign choices in this plan were explicitly approved by the product owner on `2026-08-20` and are recorded near the top of this document and in `docs/architecture-decisions.md`. Implementation remains explicitly paused.

### Remaining inputs that are not redesign decisions

- Default venue name and full public address are still missing.
- Future WhatsApp Business number/provider/pricing/privacy/template decisions remain deferred.
- Custom domain and verified Resend sender identities remain deferred.

These blockers do not prevent IA, Event Workspace, registration consolidation, request master-detail, or the structured manual WhatsApp outbox from being designed and implemented later. They do prevent claiming the full communications system is production-ready.

## Audit References

### Repository evidence reviewed

- `AGENTS.md`
- `README.md`
- `PLAN.md`
- `ROADMAP.md`
- `docs/architecture-decisions.md`
- `docs/implementation-plan.md`
- `docs/open-questions.md`
- Admin routes under `app/(dashboard)/admin/`
- Admin/layout/UI components under `components/` and `features/admin/`
- Domain contracts and Supabase adapters under `lib/`
- Supabase migrations and SQL tests under `supabase/`
- Deployed protected dashboard at representative desktop/laptop/mobile widths

### Documentation sources used

- Context7 `/vercel/next.js/v16.2.9`: App Router `searchParams`, URL-backed filter state, Server/Client query-state boundaries.
- Context7 `/supabase/supabase`: server-side filters, ordering, exact counts, and range pagination.
- [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md): accessibility, URL state, focus, responsive content, destructive-action, and interaction checks.
- [MDN `window.open()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/open): popup blocking and one-user-gesture-per-window constraints.
- [WhatsApp Business Messaging Policy](https://whatsappbusiness.com/policy/) and [WhatsApp Developer Hub](https://whatsappbusiness.com/developers/developer-hub/): official platform, policy, templates, opt-in, limits, and provider implications.
