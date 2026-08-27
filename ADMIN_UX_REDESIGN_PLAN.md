# Admin UX Redesign Plan — calendar-first, in-context operations

Status: **proposal awaiting approval. No code changed.**
Audit date: 2026-08-26 (branch `codex/product-quality-polish`, commit `69f8aff`)
Scope: the protected `/admin` surface only.

**Relationship to existing plans.** `ADMIN_OVERHAUL_PLAN.md` (v2, approved) remains the governing
document for *what the admin does*. This plan does not reopen its product decisions. It addresses a
different question — *why the surface still feels fragmented after Phases 0–4 shipped* — and finds
that the two causes are (a) one approved item that was never executed, and (b) a navigation decision
taken after it. Where this plan and `ADMIN_OVERHAUL_PLAN.md` differ, the differences are listed
explicitly in §7 as decisions for the product owner, not resolved unilaterally.

---

## 1. Diagnosis

The dashboard is organised around **entities and their states** — event, registration × status,
request × status — while the operator works in **jobs**: "the event on Thursday", "this person",
"what changed since yesterday". Every job therefore crosses two to four entity screens, and each
crossing is a full page navigation that resets scroll, selection, filter, and mental context.

Three structural causes, each verifiable in the code.

### 1.1 Two parallel registration interfaces, and the event one cannot act

`RegistrationTable` (`features/admin/components/RegistrationTable.tsx`) is the good component:
inline `ActionButton`/`ConfirmDialog`, typed action results, toasts, `router.refresh()`, **no
navigation on mutate**. It is rendered in exactly one place — `/admin/registrations`.

Inside an event, `EventRegistrationRoster` (`features/admin/components/EventRegistrationRoster.tsx`)
renders instead. It has **zero actions**. Every control it offers is a link *out of the event*:

| Control | Destination |
| --- | --- |
| `فتح` (per row) | `/admin/registrations?event=…&view=…&id=…` — a different top-level screen |
| `دعوة للحضور` | `/admin/events/[id]?tab=communications` — a different tab |
| `إدارة كل التسجيلات لهذه الفعالية` | `/admin/registrations?event=…` |

This is the user's complaint #2, exactly. And it round-trips: from `/admin/registrations`,
`RegistrationActions` opens `فتح التواصل` → `/admin/events/[id]?tab=communications`. Event →
registrations → event. Two screens, four navigations, to do one thing to one person.

`ADMIN_OVERHAUL_PLAN.md` §8 Phase 2.2 approved the fix — *"delete the duplicated registrations table
from the event workspace… roster renders inline on one page"*. It was not executed. **The single
largest source of felt fragmentation today is an approved, unimplemented decision.**

### 1.2 Actions eject the operator to a list root

Mutations that happen *inside* the event workspace redirect *out* of it:

| Action | File | Redirects to |
| --- | --- | --- |
| `updateEventAction` | `events/actions.ts:96` | `/admin/events?success=updated` |
| `changeEventStatusAction` | `events/actions.ts:118-120` | `/admin/events?success=status` |
| `createEventAction` | `events/actions.ts:58` | `/admin/events?success=created` |

Publishing an event from `/admin/events/<id>?tab=settings` therefore lands the operator on the
events *list*. `/admin/events/[id]/edit` has no breadcrumb back to the workspace at all
(`events/[id]/edit/page.tsx` — `PageHeader` only), so saving an edit is a one-way exit.

The registration actions were already fixed this way (`useActionState` + toast, no redirect). The
event actions were not. The interaction model is half-migrated, which is worse than either
consistent model, because the operator cannot predict whether a button will move them.

### 1.3 The landing screen answers no question completely

`AdminOverview.tsx` renders **five** stacked sections: operating ribbon, `يحتاج معالجة`, 7-day
agenda, recent activity, and a collapsed metrics `<details>`. Concrete defects:

- **The attention list floods.** `unconfirmedRegistrations.map(...)` emits **one card per
  registration**. At 9–15 events/month with tens of registrations each, routine new sign-ups fill
  the list; the final `.slice(0, 8)` then truncates in *category array order*, not by urgency. A
  half-empty event with a waitlist (`seat-*`) or an expiring invitation (`invite-*`) is silently
  pushed off the screen by eight ordinary registrations. The list is noisiest exactly when the
  operator most needs it to be selective.
- **Attention items discard identity.** `تسجيل جديد يحتاج تأكيد واتساب — فاطمة` links to
  `/admin/registrations?view=upcoming` — unfiltered, page 1, first row auto-selected. The card knew
  which person; the destination does not. The operator re-finds by hand what the card already told
  them. Same for `invite-*` and `reminder-*`.
- **Next event and agenda link to `/edit`.** `overview-ribbon__event` and every `agenda-item` point
  at `/admin/events/[id]/edit` — the *form*, not the workspace — while `EventCapacityTable` points
  at `/admin/events/[id]`. The same object opens two different screens depending on where it was
  clicked.
- **Duplication.** The next event appears in the ribbon, in the agenda, and in the metrics
  (`مقاعد في أقرب فعالية`). Three renderings of one fact.
- **No calendar.** The spatial view exists and is good (`CalendarMonthGrid` +
  `buildCalendarItems`, which already unifies events, pending requests, accepted bookings and
  computes overlaps) but it is two clicks away behind `/admin/events?view=calendar`. The landing
  screen offers a flat 7-day list instead — the user's complaint #2b.

### 1.4 Secondary contributors

- **21 tab states, all server round trips.** 5 sidebar + 6 event tabs + 3 registration views + 2
  events views + 5 settings tabs, every page `force-dynamic`. Each tab click is a full navigation
  with no client state. This is why the surface feels heavy even when queries are fast.
- **Chrome before content.** Every page opens with `PageHeader` eyebrow + title + description, then
  a status row, then a tab row — four bands before the first operational pixel. The event workspace
  adds a breadcrumb on top of that.
- **Global search is not global.** `AdminSearchForm` posts to `/admin/registrations` only. It cannot
  find an event or a request, though its placeholder implies a general search.
- **Dead-end wording.** `unavailableMessage("waitlist_invitation")` reads *"تُرسل الدعوة فقط بعد
  اختيار بديلة"*, and the overview generates a *"مقعد متاح مع قائمة انتظار"* card, but no selection
  control exists (`ADMIN_OVERHAUL_PLAN.md` A7 — Phase 3, unimplemented).

### 1.5 Why the navigation change amplified all of this

`ADMIN_OVERHAUL_PLAN.md` §6.1 proposed four sidebar entries with registrations living *inside* their
event. The superseding note in `docs/admin-experience-redesign-plan.md` records that the owner kept
`التسجيلات` as a fifth, peer entry. That is a defensible call — cross-event lookup is real — but it
was implemented as a *peer destination for the same data*, so the event workspace was left with a
crippled read-only copy (§1.1) and the two screens now link at each other. The decision was fine;
the execution split one job across two screens.

---

## 2. Design principles

1. **The calendar is the home object.** 9–15 events/month is one screen. Time is the operator's
   natural index, not entity type.
2. **A click never loses context.** Opening an attendee must not leave the event. Opening an event
   should not leave the calendar.
3. **One interface per concept.** One registration component, one event surface, one feedback
   mechanism.
4. **Every item carries its identity to its destination.** If a card names فاطمة, the destination
   opens فاطمة.
5. **Nothing on screen that the operator did not ask for.** A section must answer a question that is
   asked daily, or it goes.
6. **Cross-event lookup is search, not a browsing hierarchy.**

---

## 3. Target flow

```
اليوم (/admin)  ─ calendar-first hub, the only routine landing place
   │
   ├─ click a day / an item ──► Event panel  (overlay, calendar stays behind)
   │                              ├─ roster with real inline actions
   │                              ├─ attendee row expands in place   ← no navigation
   │                              ├─ communications section
   │                              └─ edit / publish / cancel         ← returns here
   │
   ├─ يحتاج معالجة (right rail) ─► resolves inline, or opens the same panel
   │                                already scrolled to the relevant person
   │
   └─ event day ──────────────► وضع اليوم (/admin/events/[id]/live)   ← the one full-screen exit

الطلبات (/admin/requests)   ─ inbox, master-detail (already correct)
الإعدادات (/admin/settings) ─ unchanged
بحث                          ─ global: attendee, event, or request → opens the right panel
```

### 3.1 `اليوم` — the hub

Two regions, no more.

**Left (primary): month calendar.** `CalendarMonthGrid` reused as-is — it already renders events,
pending requests, accepted bookings and conflict flags. Changes: today is visually anchored, the
month opens on the current month, and items open the **event panel** rather than navigating.

**Right rail: `يحتاج معالجة`, plus `الجديد` underneath.**

- Grouped by *kind*, one row per kind with a count — `٦ تسجيلات تنتظر تأكيد واتساب` — expanding to
  the names. Never one card per registration.
- Sorted by **deadline**, not by category order: expiring invitations → today's event tasks →
  unconfirmed registrations → new requests → incomplete drafts.
- Each row opens the panel **at the right person or event**, or resolves inline where the action is
  a single mutation.
- `الجديد` replaces the standalone `النشاط الأخير` section: a compact "since your last visit" list,
  three items, no separate heading band.

**Removed from the landing screen:** the operating ribbon (its next-event card is redundant with the
calendar; `الوقت بتوقيت مكة المكرمة` is decoration), the 7-day agenda (a subset of the calendar), and
the collapsed metrics `<details>` (four numbers all derivable from what is already visible). Five
sections → two. `فعالية جديدة` survives as a single control in the calendar header.

### 3.2 The event panel — the core of the fix

An overlay panel (RTL-anchored, focus-trapped, Escape-dismissible, deep-linkable via `?event=<id>`)
that opens over the hub and over the events list.

- **One scrollable body**, not six tabs. At a capacity of tens, the roster, waitlist and
  communications fit vertically with headings. Client-side state; no round trip.
- **The roster is `RegistrationTable`** — the real one, with its inline actions. Selecting an
  attendee expands their detail **inside the panel**. `EventRegistrationRoster` is deleted, not
  fixed: the fix is removal of the duplicate, per the approved Phase 2.2.
- **Edit is a mode of the panel**, not a separate route. `EventForm` renders in the panel body; save
  keeps the panel open and toasts. `/admin/events/[id]/edit` remains as a deep-link route rendering
  the same panel content standalone.
- **Publish / archive / cancel** live in the panel header via `useActionState` + toast, and **never
  redirect**.
- **`بدء وضع اليوم`** is the panel's primary action on the event day — the one deliberate
  full-screen exit, because the phone-at-the-door context genuinely differs.

### 3.3 `/admin/registrations`

Kept as a route (see decision **D2**), reframed as the **cross-event lookup and search-results
surface** — reached from the global search field, not browsed to from inside an event. Every
event→registrations link in §1.1 is deleted, which removes the round trip while preserving the
owner's decision that cross-event lookup deserves its own place.

---

## 4. Screen inventory, before and after

| Surface | Today | Proposed |
| --- | --- | --- |
| Landing | 5 stacked sections, no calendar | Calendar + attention rail |
| Event | Page with 6 URL tabs + separate edit route | One panel, no tabs, edit inline |
| Attendee | Different top-level screen | Expands inside the event panel |
| Registrations | Sidebar peer + duplicated in event | Search-results / lookup surface only |
| Tab states (server round trips) | 21 | 8 |
| Sections on landing | 5 | 2 |
| Navigations to confirm one new registration | 4 | 1 (open panel) |

---

## 5. Implementation plan

Sequenced so every phase ships alone, reverts cleanly, and leaves the dashboard working. Phases A
and B deliver most of the felt relief and touch no layout.

### Phase A — stop breaking context *(small, low risk, no visual change)*

1. `events/actions.ts` — replace the three `redirect(...)` calls with typed `ActionResult` +
   toast, matching `registrations/actions.ts`. Publish/archive/cancel keep the operator in place.
2. `AdminOverview.tsx` — every attention item carries its identity:
   `confirmation-*` → `/admin/registrations?view=upcoming&id=<registrationId>`;
   `invite-*` → `…&view=waitlist&id=<id>`; `reminder-*` → the event's communications.
3. `AdminOverview.tsx` — ribbon and agenda link to `/admin/events/<id>`, never `/edit`.
4. `events/[id]/edit/page.tsx` — breadcrumb back to the workspace.
5. Attention list: group by kind with counts, sort by deadline, drop the blind `.slice(0, 8)`.

*Tests:* one per attention category asserting the `href` carries the id; action tests asserting no
redirect and a typed success result.

### Phase B — one registration interface *(the main fix)*

1. Delete `EventRegistrationRoster.tsx` and its test.
2. Render `RegistrationTable` in the event workspace with the full `registrationActions` set and an
   event-scoped `registrationHref` that stays on `/admin/events/<id>`.
3. Delete `فتح التواصل`'s cross-screen jump: communications is a section of the same surface.
4. Delete `إدارة كل التسجيلات لهذه الفعالية`.

*Tests:* every roster row is actionable (pins the removed A1 class of defect); cancelling from
inside an event keeps the operator on the event.
*Risk:* medium, user-visible. One revertible commit; walk through together before merge.

### Phase C — collapse the event workspace into one panel

1. Replace the six `?tab=` links with client-side sections in one scroll; `?event=<id>` deep-links.
2. Move `EventForm` and `EventPosterForm` into the panel; `/edit` renders the same content.
3. Panel shell: `<dialog>`, focus trap, Escape, RTL anchoring, restores focus to the trigger.
4. Move `EventCommunicationsWorkspace`'s `now` to a server-computed prop (`ADMIN_OVERHAUL_PLAN.md`
   A15) — it currently freezes at mount and gates the 24h/3h reminders.

### Phase D — the calendar hub

1. `/admin` renders `CalendarMonthGrid` + attention rail; delete ribbon, agenda, metrics
   `<details>`.
2. Calendar items open the panel instead of navigating; today anchored; month navigation client-side.
3. `الجديد` rail from the existing recent-activity derivation, capped at three.
4. Sidebar `الفعاليات` keeps the list view for bulk/status work; the calendar lives at `/admin`.

### Phase E — noise pass

1. Drop `PageHeader` description lines on operational screens; one title band per screen.
2. Global search reaches events and requests, not registrations only.
3. Full RTL review at mobile and desktop on a preview deployment.
4. Update `ROADMAP.md`, `docs/architecture-decisions.md`, and reconcile
   `ADMIN_OVERHAUL_PLAN.md` §6.1 with the decisions in §7 below.

**Standing gates** (`AGENTS.md` §12): `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
before every merge.

---

## 6. Explicitly out of scope

Waitlist replacement UI (`ADMIN_OVERHAUL_PLAN.md` A7 / Phase 3) and activity badges remain that
plan's work. This plan removes the dead-end *links* that point at the missing invite control, but
does not build it.

---

## 7. Decisions needed before implementation

| # | Question | Recommendation |
| --- | --- | --- |
| **D1** | Does `/admin` become the calendar, replacing today's list-style `اليوم`? | **Yes** — it is the user's stated request and the data already exists. |
| **D2** | Keep `التسجيلات` as a fifth sidebar entry (owner's earlier decision) or fold it into search, per `ADMIN_OVERHAUL_PLAN.md` §6.1? | **Keep the route, remove the browsing path into it from events.** Revisit the sidebar entry after Phase B, when it is clear whether it is still opened directly. |
| **D3** | Event as an overlay panel, or as a full page that simply stops navigating internally? | **Panel** — it is what preserves the calendar context. If the panel proves cramped on mobile, it degrades to a full-screen sheet. |
| **D4** | Should the calendar hub show a day-detail view on click, or open the event panel directly? | **Directly to the panel.** A day rarely holds more than one item at this volume. |
