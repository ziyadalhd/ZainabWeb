# Events Overhaul Plan

Redesign blueprint for the two event-authoring screens of **نادي بَيْن الثقافي**:
the events list (`/admin/events`) and the create/edit form (`/admin/events/new`, `/admin/events/[id]/edit`).

**Analysis date:** 2026-08-30
**Branch at time of audit:** `codex/product-quality-polish` (`bd389ae`)
**Scope:** `app/(dashboard)/admin/(protected)/events/**`, `features/admin/components/Event*`,
`features/scheduling/components/**`, plus the shared token layer in `app/globals.css` where called out.
No public-site behaviour changes; the guest-facing `EventCard` is *read* for the preview, not altered.

## Sources

**Design source** — Claude Design project `d2694e36-2993-49fb-9924-01355fd590c7`, read via `DesignSync`:

| File | What it is |
| --- | --- |
| `Event Inspector.dc.html` | **The design for this screen.** Filter tags, event list cards with capacity meters, master/detail inspector, roster/waitlist/comms tabs |
| `_ds/classical-0518b43e-.../styles.css` | Token source of truth: `:root` variables, OKLCH ramps, component layer (`.btn`, `.tag`, `.card`, `.field`, `.input`, `.seg`, `.table`) |
| `_ds/classical-0518b43e-.../readme.md` | Written direction — the do/don't rules that outrank the numbers |
| `Daily Operations Hub.dc.html` | Already implemented; consulted only for consistency of chrome |

The design system is **Classical**. The second system in the project (`_ds/industry-68542d19-...`) is not
referenced by `Event Inspector.dc.html` and is out of scope.

**Codebase source** — direct read of this repository; every claim below cites `file:line`.

**Prior art, binding as background:**
- `OPERATIONS_HUB_REDESIGN_PLAN.md` — token audit (§1) and the D1/D3 decisions are carried forward here,
  not re-litigated. Its **Phase 0 (tonal ramps) was never executed**; this plan re-scopes it as its own Phase 0.
- `ADMIN_OVERHAUL_PLAN.md`, `docs/admin-experience-redesign-plan.md` — governing principles retained.
- `AGENTS.md` §3 (no-assumption rule) governs §7 of this document.

---

## 1. Audit — what is actually wrong

### 1.1 Events list (`app/(dashboard)/admin/(protected)/events/page.tsx`, 106 lines)

| # | Finding | Evidence |
| --- | --- | --- |
| L1 | **No filtering, search, sort, or pagination.** The page calls `eventRepository.list()` and renders every event ever created, in one table, forever. | `events/page.tsx:41`; `lib/supabase/events.ts:160` |
| L2 | **An 8-column table forced to `min-w-[960px]`,** so on any laptop-width panel it is a horizontal scroller. | `EventCapacityTable.tsx:24` |
| L3 | **Three status badges per row** (`availability`, `registrationStatus`, `publicationStatus`) with no derived single lifecycle. 8 events = 24 badges competing for the same eye. | `EventCapacityTable.tsx:58-68` |
| L4 | **The lifecycle the admin actually thinks in — upcoming / live now / past — does not exist** anywhere in code. `startsAt`/`endsAt` are present, so it is derivable with no schema change. | `lib/domain/types.ts:19-36` |
| L5 | **Capacity is bare text** (`٢٨ / ٣٠`) with no fill ratio, no "almost full" signal, no visual weight. The design specifies a 4px meter plus the label. | `EventCapacityTable.tsx:52`; `Event Inspector.dc.html` (list card) |
| L6 | **Audience is not shown in the list at all**, although `AudienceChip` already exists and audience is the design's primary segmentation. | `features/admin/components/AudienceChip.tsx`; `EventCapacityTable.tsx:38-72` |
| L7 | **Quick actions are a `<details>` disclosure nested in a table cell.** Opening it grows the row and shoves the table; it holds up to three stacked buttons plus a confirm dialog. | `EventStatusQuickActions.tsx:60-63`; `globals.css:1204-1256` |
| L8 | **No duplicate action exists.** The repository exposes only `create` / `update` / `changeStatus` / `setPosterPath`. | `lib/supabase/events.ts:196-241` |
| L9 | **No route into the live check-in view from the list.** `/admin/events/[id]/live` is reachable only from inside the event panel. | `events/[id]/live/page.tsx`; `EventCapacityTable.tsx:70-79` |
| L10 | **The mobile "responsive table" is keyed on Arabic string literals.** `td[data-label="الإجراءات"]` drives layout; renaming a column header silently breaks the mobile card. This is the broken wrapper. | `globals.css:1330-1346`; `EventCapacityTable.tsx:73` |
| L11 | **Full `Event` objects are serialized to the client** through `EventStatusQuickActions`, a Client Component receiving the whole entity per row. Commit `171da45` already fixed exactly this shape for `RegistrationTable`. | `EventCapacityTable.tsx:71`; `EventStatusQuickActions.tsx:52` |
| L12 | **The calendar tab re-fetches a second dataset in the same request** and shares no state with the list; both views are `force-dynamic, revalidate = 0`. | `events/page.tsx:17-18,42` |

### 1.2 Create / edit form (`features/admin/components/EventForm.tsx`, 287 lines)

| # | Finding | Evidence |
| --- | --- | --- |
| F1 | **One flat wall of inputs.** Four `fieldset`s, every control mounted at once, `max-w-5xl`, no step structure, no progress, no summary. | `EventForm.tsx:117-285` |
| F2 | **Single-error validation.** `EventFormActionState` carries one `error?: EventFormActionError`, and `validateEventInput` returns on the first failure — three bad fields means three round trips, one message each. **This is the single biggest defect on the screen.** | `events/actions.ts:14-21`; `lib/domain/event-input.ts:93-146` |
| F3 | **No client-side validation at all** — the form is `noValidate`, so even a blank title costs a server round trip. | `EventForm.tsx:117` |
| F4 | **Two competing poster uploaders on the edit page**: `EventForm`'s own poster fieldset *and* a separate `EventPosterForm` below it, both writing the same storage path through different actions. | `events/[id]/edit/page.tsx:36-37`; `events/actions.ts:88-99,141` |
| F5 | **No guest-facing preview.** The admin cannot see what the event card will look like until it is published. | `features/events/components/EventCard.tsx` (exists, unused by admin) |
| F6 | **No past-date guard.** `ArabicDatePicker` sets no `min`; `validateEventInput` only checks `end > start`. A draft can be authored last week with no warning at any layer. | `ArabicDatePicker.tsx:19-60`; `event-input.ts:113-118` |
| F7 | **End-date handling is a hidden-input trick.** A checkbox toggles `differentDay`, and a hidden `endDate` mirrors `startDate` when unchecked — invisible state, untestable through the accessibility tree. | `EventSchedulePicker.tsx:80` |
| F8 | **Section legends use physical borders** (`border-r-4`, `pr-3`) instead of logical properties, unlike the rest of `globals.css`. | `EventForm.tsx:124,163,178` |
| F9 | **Price formatting logic lives in the component** (`formatPriceInput`) while its parser lives in `lib/domain` — the pair should be symmetric and shared. | `EventForm.tsx:45-50` vs `event-input.ts:73-91` |
| F10 | **Errors are announced only next to the field**; the focus jump depends on a hand-maintained `fieldForError` map that must be kept in sync with three other tables by hand. | `EventForm.tsx:34-43,105-111` |
| F11 | **`new` has no breadcrumb**, `edit` does — the two entry points are visually unrelated. | `events/new/page.tsx:13-18` vs `events/[id]/edit/page.tsx:19-34` |

**What is correct and must not be rewritten:** `riyadhDateTimeLocalToIso` (`event-input.ts:44-68`) is a
correct, tested UTC↔`Asia/Riyadh` conversion with a real round-trip validity check; Arabic-Indic digit
normalisation (`event-input.ts:73-91`); `requireAdmin()` in every page and every action
(`events/page.tsx:36`, `actions.ts:36,68,110,143`); the `canChangeEventStatus` transition table
(`event-input.ts:148-160`).

### 1.3 Design alignment gap

Classical's four prohibitions (`readme.md` → "Don't") versus what these screens ship:

| Classical rule | Current state | Location |
| --- | --- | --- |
| Never fill a button with solid accent | `.button-primary` is solid forest | `globals.css:516` |
| Cards are transparent + 1px divider | `.card-surface`, `.form-surface` are filled | `globals.css:260,490` |
| Elevation is a whisper; radius 4px | `--radius-control: 0.75rem` (3× rounder), four-step shadow scale | `globals.css:12-13,15-18` |
| Headings cap at semibold; larger = lighter | `font-black` (900) on the form legends, `EventCard`, `ArabicDatePicker` | `EventForm.tsx:124`; `EventCard.tsx:41` |
| Tabular figures for all data numerals | unspecified; `.data-value` exists but is not applied to capacity | `globals.css:256`; `EventCapacityTable.tsx:52` |
| Prefer a ramp step over ad-hoc `color-mix()` | **no ramps exist in this project** | `globals.css:33-62` |

**Typography note.** This product ships a single family, `--font-thmanyah-sans` (`globals.css:120`,
`app/layout.tsx:41`). Classical's Amiri/Naskh heading–body pairing **does not transfer**; hierarchy here
must be carried by size, weight, tracking, and colour alone. That makes the weight ceiling more important,
not less — with one family, a 900 and a 400 in the same view read as two different products.

**Carried-forward decisions.** `OPERATIONS_HUB_REDESIGN_PLAN.md` §6 settled: keep the club palette, take
Classical's *structure* (D1); the font-weight conflict with commit `bd389ae` (D3) is resolved in favour of
the system's ceiling. This plan assumes both and does not reopen them.

---

## 2. Design alignment — what to adopt

### 2.1 Phase 0 tokens (the prerequisite nothing else can be built cleanly on)

Generate 100–900 OKLCH ramps **from the club's own palette** — forest `#204f28`, olive `#708a58`,
amber `#ffb623` — on one shared perceptual lightness scale, exactly as Classical does. Usage rule verbatim
from the readme: *100–300 for tinted fills, hovers and subtle borders; 500 as the role's base; 700–900 for
text on tinted fills and for pressed states.*

This is what removes the hand-mixed colour from every new state and retires stray raw hexes such as
`#596bab` (`globals.css:328,364`). It is independent of every other phase and carries the lowest risk.

Add alongside them:

```
--meter-track      : var(--color-neutral-200)   /* capacity meter ground */
--meter-fill       : var(--brand-olive)          /* < 80% filled */
--meter-fill-warn  : var(--brand-amber)          /* 80–99% */
--meter-fill-full  : var(--color-error-text)     /* 100% */
--divider-hairline : color-mix(in srgb, var(--color-text) 16%, transparent)
```

`--divider-hairline` is the technique Classical uses everywhere and the one the current opaque
`--color-border: #d6d9c8` cannot reproduce: a rule that reads correctly on *any* of the three surfaces.

Add a `.numeral` utility (`font-variant-numeric: tabular-nums`) and apply it to every capacity, price,
count, and time in both screens. Today only `.data-value` does this, and only in one cell.

### 2.2 Component mapping — Classical → this codebase

| Classical | Maps to | Action |
| --- | --- | --- |
| `.tag` + `.tag-accent/-neutral/-outline` | `AudienceChip`, `StatusBadge` | Re-tint from the new ramps (tint at 100, text at 800). `AudienceChip` is already exactly this shape. |
| `.card` + `.card-kicker/-title/-meta` + `.elev-sm` | new `EventListCard` | Transparent ground, 1px hairline, kicker = event type label, title = event title |
| `.field` + `.input` | `.field-control` (`globals.css:579`) | Already close; align radius, hairline border, and hover/focus to the system |
| `.seg` + `.seg-opt` | new filter bar | Native radio inputs, no script — the design's own filter row is exactly this |
| `.btn-primary` (accent **outline**) | `.button-primary` | See D4 (§7) before changing globally |
| `.table` | `EventCapacityTable` | **Retired** for the list (§3.1); the pattern survives inside the event panel's roster |
| `.hr` | section dividers in the form | Replaces the `border-t border-[var(--color-border)]` repetition |

---

## 3. Events list UX overhaul

### 3.1 The shape change: table → segmented card list

Replace `EventCapacityTable` on `/admin/events` with a card list. Three reasons, all evidenced above:
the table needs 960px it does not have (L2); its mobile fallback is held together by Arabic string
literals (L10); and the design for this exact screen is a card list (`Event Inspector.dc.html`).

`EventCapacityTable` is **not deleted** — it is still used in compact form elsewhere; it is removed from
this route only, and its `compact` mode remains its supported use.

```
┌─────────────────────────────────────────────────────────────┐
│ [للبالغات]                                  ٣١ أغسطس · ٧:٠٠م │   ← chip + when, one hairline row
│ ليلة أدبية: حديث في السيرة والمكان                             │   ← title, semibold, 17px
│ أمسية حوارية · مسودة                                          │   ← kicker: type · lifecycle
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░  السعة ٢٨/٣٠                            │   ← meter + tabular label
│ ─────────────────────────────────────────────────────────── │
│ [إدارة الفعالية]  [تعديل]  [نسخ]  [وضع اليوم]  [⋯ الحالة]     │   ← always visible, no disclosure
└─────────────────────────────────────────────────────────────┘
```

One card = one event = one decision. Status becomes **one** derived lifecycle chip instead of three badges
(L3); registration/publication detail moves into the event panel, where it is already presented.

### 3.2 Derived lifecycle — a pure function, not a schema change

New module `features/admin/event-lifecycle.ts`, modelled on the existing pure helpers
(`features/admin/calendar-items.ts`, `attention-items.ts`) so it is unit-testable with no database:

```ts
export type EventLifecycle = "draft" | "upcoming" | "live" | "past" | "archived" | "cancelled";

export function eventLifecycle(event: Event, now: Date): EventLifecycle;
```

Precedence, in order: `cancelled` → `archived` → `draft` → `live` (`startsAt <= now < endsAt ?? startsAt+2h`)
→ `past` (`now >= endsAt`) → `upcoming`. `now` is injected, never read from the module — the same
discipline `day-pulse.ts` already uses, and the reason those tests are deterministic.

### 3.3 Filtering — server-side, via `searchParams`

Filters are URL state (`?status=upcoming&audience=youth&q=…`), read in the Server Component and applied
before rendering. This keeps the full event list out of the client bundle (L11), makes every filtered view
linkable and back-button-correct, and matches how `view`/`month` already work (`events/page.tsx:33-40`).

- **Status segment** (single-select): `الكل · القادمة · المباشرة الآن · المسودات · المنتهية · المؤرشفة`
- **Audience segment** (single-select): `الكل` + the three audience chips
- **Search** reuses `matchEvents` (`features/admin/admin-search.ts:7`) — already written and tested.

Default view is `القادمة`. Today the default is "every event ever created" (L1); an operations screen
should open on what is actionable.

Counts render inside each segment option (`القادمة ٦`) so the admin sees the shape of the month without
clicking. Cheap: one pass over the already-loaded list.

### 3.4 Capacity as a ratio, not a fraction

`features/admin/capacity.ts`:

```ts
export function capacityRatio(active: number, capacity: number): number;     // 0..1, clamped
export function capacityTone(ratio: number): "calm" | "warn" | "full";       // <0.8 / <1 / >=1
```

Rendered as the design specifies: a 4px meter (`role="img"` with an Arabic `aria-label`, since it duplicates
adjacent text) plus `السعة ٢٨/٣٠` in tabular figures. `formatArabicNumber` already exists
(`lib/format/date.ts:101`); add `formatCapacityRatio(active, capacity)` beside it so the string is produced
in exactly one place.

### 3.5 Quick contextual actions

| Action | Behaviour | Cost |
| --- | --- | --- |
| **إدارة الفعالية** | Existing overlay (`?event=<id>`) — unchanged | none |
| **تعديل** | Link to `/admin/events/[id]/edit` | none |
| **نسخ** | New `duplicateEventAction` → new **draft** with `(نسخة)` appended, same audience/kind/capacity/price, **date cleared** so it cannot silently publish into the past | new repo method + action (D5) |
| **وضع اليوم** | Link to `/admin/events/[id]/live`, shown **only** when lifecycle is `live` or `upcoming` and the day matches — `isSameRiyadhDate` already exists (`lib/format/date.ts:183`) | none |
| **الحالة** | Status transitions, moved out of the in-row `<details>` into the shared `Overlay` (`features/admin/components/Overlay.tsx`) so opening it never reflows the list | refactor |

Every one of these is a transition already allowed by `canChangeEventStatus` or an existing route. Nothing
here invents a business rule.

---

## 4. Form flow overhaul

### 4.1 Four sections, one page, one save

Not a wizard. A wizard adds navigation cost to a form the admin fills dozens of times and knows by heart.
Instead: one page, four labelled sections separated by hairlines, a sticky section rail on desktop
(the `event-panel__section-nav` pattern already in `globals.css:995` and proven in the event panel), and
one save.

| # | Section | Fields | Notes |
| --- | --- | --- | --- |
| 1 | **الأساسيات** | title, kind, audience, event type label | Unchanged fields, restructured |
| 2 | **الموعد والمكان** | `EventSchedulePicker`, + venue (D3) | Venue is **not** in the schema today |
| 3 | **المقاعد والفئة** | capacity, audience recap, registration status | Capacity gets the same meter as the list when editing |
| 4 | **السعر والنشر** | price, publication state readout, poster | The two poster uploaders collapse into one (F4) |

Section 4's publication readout replaces the guesswork in `EventStatusQuickActions.tsx:57`
(`readyToPublish = endsAt !== null && priceHalalas !== null`) with an explicit, always-visible checklist:
what is still missing before this draft can be published.

### 4.2 Multi-field validation — the core change

Extend the domain result type to carry **all** failures, not the first:

```ts
export type EventInputResult =
  | { ok: true; value: EventInput }
  | { ok: false; errors: readonly EventInputErrorCode[] };   // was: error: EventInputErrorCode
```

`validateEventInput` collects instead of early-returning. `EventFormActionState.error?: …` becomes
`errors?: readonly EventFormActionError[]`. `actions.test.ts` (185 lines) and `EventForm.test.tsx` update
with it; this is a breaking change to two call sites and no more (`events/actions.ts:38,72`).

Layer the validation so most errors never reach the server:

1. **Native constraints** — drop `noValidate` (F3), keep `required` / `min` / `max` / `maxLength`, add
   `min` (today, in Riyadh) to the date picker (F6).
2. **On blur, per field** — the same domain parsers, called client-side. `parsePriceSarToHalalas` and
   `riyadhDateAndTimeToIso` are pure and framework-free (`lib/domain/event-input.ts`); they run in both
   places from one source. This is the payoff of the existing domain boundary.
3. **Server action** — authoritative, unchanged in authority, now returning every failure at once.

An error summary (`role="alert"`, focused on submit) lists every failing field as a link to its input,
replacing the hand-maintained `fieldForError` focus map (F10).

### 4.3 Schedule and timezone

`riyadhDateTimeLocalToIso` is correct — **do not touch it**. The gaps are all above it:

- `ArabicDatePicker` gains `minDate`; drafts default to disallowing past dates, with an explicit
  "هذه الفعالية في الماضي" warning rather than a hard block on **edit** (a past event may legitimately be
  corrected after the fact).
- `validateEventInput` gains a `startsAtInPast` code, surfaced as a warning on edit and an error on create.
- Replace the hidden mirrored `endDate` input (F7) with an explicit disabled-but-visible end-date field
  that shows the inherited value — visible state instead of invisible state.
- The `توقيت السعودية` marker (`EventSchedulePicker.tsx:65`) moves next to the resolved preview line, where
  the value it qualifies actually appears.
- Duration is derived and shown (`formatHourCount`/`formatMinuteCount` already exist,
  `lib/format/date.ts:112-125`), so a 14-hour event is visible as a mistake at authoring time.

### 4.4 Live guest preview

Extract the presentational body of `EventCard` into `EventCardView`, taking plain props — no data access,
no `Link` to a not-yet-existing route. `features/events/components/EventCard.tsx` becomes a thin server
wrapper over it, and the admin form renders the same component from live form state beside section 4.

The preview is the guest's view, not the admin's: audience chip, type, title, date, seats, price, poster.
It is the only honest way to answer "how will this read to a guest", and it costs no new markup — it is the
component the public site already ships.

### 4.5 Feedback

`useActionState` stays. Add:

- Per-section completion marks in the rail (a section with no errors and all required fields filled).
- `useOptimistic` on the save button state; the existing `pending` flag drives it today at page granularity.
- On create, keep the redirect to `?event=<id>` (`EventForm.tsx:74`) but pass a success flag so the panel
  opens with a confirmation rather than silently.
- Keep the `beforeunload` dirty guard (`EventForm.tsx:88-95`) — it is correct and rare in this codebase.

---

## 5. Architecture and boundaries

**Unchanged and non-negotiable:**

- `requireAdmin()` at the top of every page and every action. New actions (`duplicateEventAction`) get it
  as their first statement, matching `actions.ts:36,68,110,143`.
- Generated `Database` types stay inside `lib/supabase/` (`AGENTS.md` §7). The duplicate action adds a
  method to `SupabaseEventRepository`, not a query in the action.
- `lib/domain/` stays framework- and provider-neutral. `eventLifecycle` and `capacityRatio` take domain
  types and a clock, nothing else.
- RLS is unaffected — no new table, no new column, no migration in this plan.

**Changed:**

- Client Components receive narrowed props, not whole `Event` entities (L11) — the shape commit `171da45`
  established for `RegistrationTable`.
- Filtering happens in the Server Component before render, so the client tree carries only the visible page.
- New pure modules go under `features/admin/` with colocated `*.test.ts`, matching `calendar-items.ts`,
  `day-pulse.ts`, `relative-time.ts`.

---

## 6. Phased roadmap

Each phase is independently shippable and leaves `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
green (`AGENTS.md` §12/§20).

### Phase 0 — Token foundation
Generate the three OKLCH ramps from forest/olive/amber; add meter tokens, `--divider-hairline`, `.numeral`.
No component consumes them yet.
**Acceptance:** ramps present in `app/globals.css`; every step documented with its usage band; the raw
`#596bab` in `.calendar-item--booking` replaced by a ramp step; zero visual diff on every existing screen.

### Phase 1 — Lifecycle and capacity logic
`features/admin/event-lifecycle.ts` and `features/admin/capacity.ts`, plus `formatCapacityRatio` in
`lib/format/date.ts`. Pure functions only; no UI.
**Acceptance:** unit tests cover all six lifecycle states including the `live` boundary with a null
`endsAt`, and the three capacity tones at 0.79 / 0.80 / 1.00 / over-capacity; injected clock, no
`new Date()` inside either module.

### Phase 2 — Events list rebuild
`EventListCard` + `EventFilterBar`; `/admin/events` renders cards; `EventCapacityTable` removed from this
route only.
**Acceptance:** no horizontal scroll at 375px, 768px, or 1280px; one lifecycle chip per card; audience chip
present on every card; capacity meter with a tabular label and an Arabic `aria-label`; filters are URL
state and survive reload and the back button; the default view is `القادمة`; no `Event` object crosses a
client boundary whole; empty state per filter, not one generic message.

### Phase 3 — Quick contextual actions
Status menu moved into `Overlay`; edit and live links added; `duplicateEventAction` + repository method.
**Acceptance:** every action reachable in one click from the card; opening the status menu does not reflow
the list; duplicate creates a draft with a cleared date and appended `(نسخة)`, and is rejected for a
non-admin session; the live link appears only when the lifecycle warrants it; `canChangeEventStatus`
remains the single authority on transitions.

### Phase 4 — Validation model
`EventInputResult` carries `errors[]`; action state and both call sites updated; error summary component;
`noValidate` dropped; blur-time client validation through the shared domain parsers.
**Acceptance:** submitting a form with title, capacity, and price all invalid reports **three** errors in
one round trip; the summary is focused and announced; each entry links to its field; existing
`actions.test.ts` cases pass against the new shape; no validation rule exists in two places.

### Phase 5 — Form restructure
Four sections, hairline dividers, sticky section rail, publication checklist, poster uploaders merged.
**Acceptance:** one poster control on the edit page; the publication checklist names exactly what blocks
publishing; the rail marks section completion; legends use logical properties; `.hr` replaces the ad-hoc
`border-t` repetition; heading weights respect the semibold ceiling.

### Phase 6 — Schedule hardening
`minDate` on the picker; `startsAtInPast`; visible inherited end date; derived duration; timezone marker
relocated.
**Acceptance:** a past start date is blocked on create and warned on edit; the end date is visible in both
same-day and different-day modes with no hidden input carrying state; duration is shown and updates live;
`riyadhDateTimeLocalToIso` is unmodified and its tests are untouched.

### Phase 7 — Live preview
`EventCardView` extracted; `EventCard` becomes a wrapper; the admin form renders the preview from form state.
**Acceptance:** the public event list and detail pages are pixel-identical before and after the extraction;
the preview updates on every field change including the local poster object URL; no admin-only prop leaks
into the public component.

### Phase 8 — RTL, accessibility, motion, tests
**Acceptance:** logical properties throughout both screens (no `border-r`/`pl-`/`mr-`); one system-level
`:focus-visible`; every meter and chip has an Arabic accessible name; every filter is keyboard-reachable
and announces its state; motion respects `prefers-reduced-motion`; component tests for `EventListCard`,
`EventFilterBar`, and the restructured `EventForm`.

### Sequencing and risk

```
Phase 0 ──┬── Phase 1 ── Phase 2 ── Phase 3
          └── Phase 4 ── Phase 5 ── Phase 6 ── Phase 7 ── Phase 8
```

Phases 0 and 1 are pure additions and carry no user-visible risk. Phase 2 is the highest-risk step (it
retires a rendering path on a live route) and should ship alone. Phase 4 changes a shared domain type and
must land before Phase 5 to avoid rewriting the form twice.

---

## 7. Decisions required before implementation (`AGENTS.md` §3)

These are product decisions. **None may be resolved silently in code.**

**D1 — Audience labels.** The design file uses `للبالغات` / `للفتيات ١٣–١٧` / `للأطفال ٦–١٢`. The codebase
ships `الكبار` / `اليافعون` / `الصغار` (`AudienceChip.tsx:4-8`, `EventCard.tsx:12-16`). The 13–17 youth
boundary is approved (`docs/open-questions.md:27`); **the 6–12 children range is not approved anywhere**.
*Recommendation:* adopt the design's phrasing only if the owner approves it, and only with the age ranges
confirmed — and change it in **both** the admin and the public component, or in neither.

**D2 — Retiring the desktop table.** Phase 2 replaces the table with cards on `/admin/events`. Confirm the
owner does not depend on a dense scannable grid for a long month. *Recommendation:* ship cards; the design
specifies them and the table does not fit the viewport (L2).

**D3 — Missing event fields.** `Event Inspector.dc.html` displays الموقع، المدة، المُيسِّرة، وصف الفعالية.
`lib/domain/types.ts:19-36` has none of them (duration is derivable; the other three are not). Adding them
means a migration, RLS review, public-site surface, and approved copy. *Recommendation:* keep them out of
this plan; open a separate scoped decision. Section 4.1's venue field is **blocked on this**.

**D4 — Outlined primary button.** Classical's `.btn-primary` is an accent outline on transparent
(`styles.css`, buttons). `.button-primary` is solid forest across the whole product (`globals.css:516`).
*Recommendation:* do not change it inside these two screens alone — that splits the identity. Either
schedule it product-wide as its own change, or keep the solid primary and take the rest of the system.

**D5 — Duplicate semantics.** Should a duplicated event copy the poster file, reference the same stored
object, or start with no poster? Copying costs storage; sharing means deleting one event's poster breaks
the other's. *Recommendation:* start with no poster; it is the only option with no shared-state failure mode.

**D6 — Default list scope.** §3.3 defaults to `القادمة`. Confirm the admin never opens this screen looking
for an archived event first.

---

## 8. What is explicitly preserved

- `riyadhDateTimeLocalToIso` and every timezone test.
- `canChangeEventStatus` and its transition table.
- `requireAdmin()` in every page and action; RLS untouched; no migration.
- The event overlay panel (`?event=<id>`), its section navigation, and the calendar view.
- `EventCapacityTable` in `compact` mode wherever it is used outside this route.
- The `beforeunload` dirty guard.
- Arabic-only RTL copy; English identifiers; the club palette.
