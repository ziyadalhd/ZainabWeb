# Operations Hub Redesign Plan

Migration blueprint for turning the `/admin` dashboard of **نادي بَيْن الثقافي** into an editorial,
action-driven **Daily Operations Hub**.

**Status:** **Phases 1 through 5 implemented** (2026-08-30) — see the implementation notes under each
phase below for what shipped, what deliberately deviated from the original plan, and why. **Phase 0 (the
color-ramp/radius/shadow token pass) was never executed** — every new component reuses the *existing*
tokens (`--brand-olive`, `--color-error-bg`, `--radius-control`, and so on) as-is; no OKLCH ramps were
generated and no radius/shadow retuning happened. It remains the one open item from the original plan.
All §6 decisions resolved by the product owner on 2026-08-30.
**Analysis date:** 2026-08-30
**Branch at time of audit:** `codex/product-quality-polish` (`bd389ae`)
**Scope:** protected admin experience only (`app/(dashboard)/admin/(protected)/...`). No public-site changes
except the shared token layer in `app/globals.css`, which is called out explicitly where it applies.

## Sources

**Design source** — Claude Design project `d2694e36-2993-49fb-9924-01355fd590c7`, read via the
`claude_design` MCP (`DesignSync`):

| File | What it actually is |
| --- | --- |
| `Daily Operations Hub.dc.html` | The design itself: markup, inline styles, Arabic copy, and the interaction logic (`DCLogic` state class) |
| `_ds/classical-.../styles.css` | **The token source of truth.** `:root` variables + the component layer |
| `_ds/classical-.../readme.md` | Written design direction — the "do / don't" rules that matter more than the numbers |
| `_ds/classical-.../_ds_manifest.json` | Machine-readable token index; confirms `globalCssPaths: ["styles.css"]` and every token `definedIn: styles.css` |
| `_ds/classical-.../_ds_bundle.js` | Design-canvas runtime loader. **Carries no design information** |
| `support.js` | Design-canvas runtime (`x-dc`, `sc-if`, `sc-for`, `DCLogic`). **Carries no design information** |

The design system is named **Classical**. A second system (`_ds/industry-68542d19-...`) exists in the
project but is not referenced by `Daily Operations Hub.dc.html` and is out of scope.

**Codebase source** — direct read of this repository. Every claim below cites a file and, where useful, a line.

**Prior art in this repo** (both remain binding background):
- `ADMIN_OVERHAUL_PLAN.md` — the current approved admin plan. Its governing principle and its audit
  findings are carried forward here, not replaced.
- `docs/admin-experience-redesign-plan.md` — superseded on navigation, accurate on workspace shape.

---

## 1. Design tokens — audit and extraction

### 1.1 Extracted token table

Every value below is verbatim from `_ds/classical-0518b43e-ffda-4da7-af78-ce4e0ad9071c/styles.css`.

#### Color roles

| Token | Classical | Current (`app/globals.css`) | Verdict |
| --- | --- | --- | --- |
| `--color-bg` / `--color-page` | `#f3f2f2` cool near-white | `#fffbef` warm cream | **Conflict** — see D1 |
| `--color-surface` | `#eae9e9` | `#fffef8` | Conflict |
| `--color-text` | `#201f1d` near-black | `#18361e` blackened green | Conflict |
| accent | `--color-accent #b68235` (gold), **mono** | three: `#204f28` forest, `#708a58` olive, `#ffb623` amber | Conflict |
| divider | `color-mix(in srgb, #201f1d 16%, transparent)` | `--color-border #d6d9c8` (opaque) | **Adopt the technique** |

`--color-accent-2 #ac803e` is a machine-derived stand-in. The readme states plainly: *"this is a mono
scheme: no second accent was chosen … treat them as one role."* Do not build a semantic on it.

#### Tonal ramps — the single most valuable extraction

Classical carries a 100–900 ramp for every role (`--color-neutral-*`, `--color-accent-*`), generated in
OKLCH **on one shared perceptual lightness scale**, so step 300 of any ramp has the same visual weight as
step 300 of any other.

```
neutral: 100 #f8f4f4 · 200 #eae7e7 · 300 #d7d3d3 · 400 #bab6b6 · 500 #9b9797
         600 #7d7979 · 700 #605d5d · 800 #444141 · 900 #2d2b2b
accent : 100 #fff3e4 · 200 #ffe3bf · 300 #facb8d · 400 #e1ad66 · 500 #c28d41
         600 #a06f24 · 700 #7d5411 · 800 #5a3b0a · 900 #3a270d
```

Documented usage rule: **100–300 for tinted fills, hovers and subtle borders; 500 as the role's base;
700–900 for text on tinted fills and for pressed states.** Prefer a ramp step over an ad-hoc `color-mix()`.

`app/globals.css` has **no ramps at all** — only single values plus a set of functional pairs
(`--color-success-bg` / `--color-success-text`, etc.). This is why every new admin state so far has needed a
hand-mixed color, and why `.calendar-item--booking` carries a raw hex `#596bab`
(`app/globals.css:326`, `:332`) that belongs to no system.

**This is the extraction with the highest value and the lowest risk. It is independent of the palette
decision (D1): the ramp structure can be generated from the club's own forest / olive / amber.**

#### Typography

| Aspect | Classical | This project |
| --- | --- | --- |
| Heading face | `Cormorant Garamond` — **overridden to `Amiri` inside `.bayn-root`** | `--font-thmanyah-sans` |
| Body face | `Lora` — **overridden to `Noto Naskh Arabic`** | `--font-thmanyah-sans` |
| Heading weight | `--font-heading-weight: 600` — a hard ceiling | `font-bold` (700) and `font-weight: 900` both in use |
| Scale | fixed: h1 42 · h2 32 · h3 25 · h4 20 · h5 16 · h6 13px | Tailwind utility sizes, unsystematised |
| Body | 15px / 1.55 | 16px / 1.7 |
| h6 | `letter-spacing: .08em; text-transform: uppercase` — the kicker | `.eyebrow` (`app/globals.css:222`) — same role, already exists |
| Figures | tabular (`"tnum"`) for kickers, tables, charts, numerals; text figures in prose | not specified |

The design file loads Amiri + Noto Naskh Arabic and scopes them to `.bayn-root`, so the Latin faces never
render. The Arabic pairing is: **Amiri for headings, Noto Naskh Arabic for body.**

The readme is explicit and unusually strong on weight:

> *"Bold is avoided: interface headings cap at semibold … and the bigger the text the lighter it sets."*

This directly contradicts commit `bd389ae` (`style(admin): update font weights and spacing for consistency`),
which is the most recent change on this branch. **D3 must be settled before touching type.**

#### Spacing, radius, elevation

```
--space-1 4.6px   --space-2 9.2px   --space-3 13.8px
--space-4 18.4px  --space-6 27.6px  --space-8 36.8px      (a 1.15x density scale on a 4px base)

--radius-sm 2px   --radius-md 4px   --radius-lg 7px

--shadow-sm 0 1px 2px  color-mix(in srgb, #2d2b2b 14%, transparent)
--shadow-md 0 3px 10px color-mix(in srgb, #2d2b2b 16%, transparent)
--shadow-lg 0 12px 32px color-mix(in srgb, #2d2b2b 22%, transparent)
```

Current values, for comparison: `--radius-control: 0.75rem` (12px) and `--radius-surface: 1rem` (16px) —
**three to four times rounder**; and a four-step shadow scale (`--shadow-resting` … `--shadow-overlay`)
that is heavier at every step.

The current `--space-*` scale (4px base, `0.25rem`–`5rem`) is functionally equivalent in intent and
**does not need replacing** — it needs to be *used* consistently, which it currently is not (component
classes use it; Tailwind utilities in `.tsx` bypass it).

### 1.2 The written direction — the part that is not numbers

`readme.md` states four prohibitions. They are more consequential than any hex value:

> - Do not fill cards or buttons with solid accent color.
> - Do not use heavy drop shadows — elevation here is a whisper.
> - Do not tighten the leading or crowd the margins.
> - Do not swap in a sans-serif for emphasis; weight and italics do that job.

One rule underlies all four: **color is a stroke, not a fill.** Structure is carried by hairline rules.

Evidence in the stylesheet, not just the prose:
- `.btn-primary` = `color: var(--color-accent); border-color: var(--color-accent);` on `background: transparent`. The primary action is an **outline**.
- `.card` = `background: transparent; border: 1px solid var(--color-divider);`
- `.tag-accent` = `background: var(--color-accent-100); color: var(--color-accent-800);` — tint from the ramp's light end, text from its dark end. This is the *only* place fill is allowed, and only at step 100.

**Current state is the inverse on all three counts:**

| Current | Location |
| --- | --- |
| `.button-primary` is solid forest green | `app/globals.css:484` |
| `.card-surface` is a filled surface | `app/globals.css:260` |
| `.attention-item--urgent` uses `border-inline-start: 0.32rem` — a 5px slab, not a hairline | `app/globals.css:273` |

### 1.3 Interaction states

Classical specifies them as system-level, never per-page:

- `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }` — never the browser default.
- Hover: a `color-mix()` tint of the accent at 10–12%.
- Pressed: one ramp step past the base (`--color-accent-600` on a light ground).
- `::selection`: an accent tint.
- Disabled: `opacity: 0.45`.

This project already has `--color-focus: #ffb623` and a focus treatment; it is **not** applied uniformly.

### 1.4 Alignment strategy

The recommendation is to **adopt Classical's structure and discipline, and reject its palette** —
pending D1. Concretely:

| Adopt | Reject / adapt |
| --- | --- |
| OKLCH 100–900 ramps, generated from forest / olive / amber | The gold `#b68235` mono accent |
| `color-mix()` transparent dividers | The `#f3f2f2` cool ground |
| Outlined primary action; transparent bordered cards | Cormorant / Lora (Arabic-only product) |
| Whisper elevation; 4px radius | — |
| Ramp-step discipline over ad-hoc mixes | — |
| Tabular figures for all data numerals | — |
| System-level interaction states | — |

The club's palette is approved product definition (`PLAN.md`) and is used across the entire public site.
Changing it inside `/admin` alone would split the identity in two. Changing it everywhere is a different
project. **Recommendation: keep the palette, take the system.**

---

## 2. User flow and UX overhaul

### 2.1 Design pattern 1 — Action Triage Stream (تيار العناية العاجلة)

**Structure in the design file.** A flat column of `<article class="card bayn-card elev-sm">` rows, each a
three-part horizontal layout:

```
[ 20px Lucide icon ] [ subject name + urgency tag / self-contained context sentence ] [ inline actions ]
```

**Five defining properties, each a deliberate inversion of what we ship today:**

1. **The person is the headline.** `أروى المطيري` — not `دعوة انتظار تنتهي قريبًا`. Category is carried
   silently by the icon (`stroke: var(--color-accent-700)`).
2. **The deadline is a tag, at minute precision.** `تنتهي الدعوة خلال ٤٠ دقيقة`, `خلال ساعتين` — not a
   24-hour bucket.
3. **The context sentence is self-sufficient.** *"على قائمة انتظار «ليلة أدبية: حديث في السيرة والمكان» —
   غدًا ٧:٠٠ م، السعة ٢٨/٣٠"* — event, time and capacity in one line, so the decision needs no navigation.
4. **The action lives in the card.** One or two buttons — primary (`تأكيد الدعوة`) and secondary
   (`إعادة للقائمة`). There is no `←` that carries the user elsewhere.
5. **No grouping.** Five items are five cards, even when two share a type (Arwa and Rana are both
   expiring waitlist invitations, shown as two separate cards).

**The five item types shown**, and what each maps to here:

| # | Design card | Data available today | Action available today |
| --- | --- | --- | --- |
| 1 | Waitlist invite expiring in 40 min | `status: "invited"` + `invitationExpiresAt` | **Missing** — see G1 |
| 2 | Private space request, 2 days old | `AdminServiceRequest` | navigate only |
| 3 | Incomplete payment | `paymentStatus: "unpaid"` | `setRegistrationPaymentStatusAction` ✅ |
| 4 | Second waitlist invite, 2 h | same as 1 | Missing — G1 |
| 5 | WhatsApp message awaiting reply | **no inbound model** — see G2 | — |

**Current implementation, and why it is the biggest bottleneck.**

`features/admin/attention-items.ts` builds seven `AttentionGroup`s keyed by *category*
(`invite`, `reminder`, `confirmation`, `request`, `draft`, `seat`, `payment`), each holding
`AttentionMember { id, description, href, deadline }`. The priority logic is genuinely good — it sorts by
real deadline across all seven sources.

But `AttentionMember` **carries only an `href`**. It has no concept of an action. And so
`AdminHub.tsx:70-95` renders exactly two shapes:

- one member → a `<Link>` with a `←` arrow, and
- many members → a `<details>` that hides the people behind a category title and a text `＋` / `−`
  (`app/globals.css:277-282`).

The consequences:

- **B1 — Zero one-click actions.** Every triage item is a navigation. Confirming a seat means: read the
  category, expand `<details>`, click the person, land on `/admin/registrations?view=waitlist&id=…`, find
  the row, act, lose your place.
- **B2 — The person is hidden behind the category.** The opposite of the design.
- **B3 — `<details>` as a disclosure menu** is the same accessibility pattern already flagged as
  **A11** in `ADMIN_OVERHAUL_PLAN.md` ("destructive actions behind an inaccessible `<details>` pseudo-menu").
- **B4 — Coarse deadlines.** `withinHours(value, now, 24)` buckets everything into a day. A 40-minute
  window and a 23-hour window read identically.

**Click-count comparison — confirming one waitlist seat:**

| | Today | Target |
| --- | --- | --- |
| Steps | expand group → click person → page load → locate row → open action → confirm | **1** |
| Full page loads | 2 (navigate + post-action revalidate) | 0 |
| Context lost | scroll position, which items remained | none |

### 2.2 Design pattern 2 — Today's Pulse (نبض اليوم)

**Structure.** A right-hand rail (in RTL reading order) with two stacked parts.

*Week strip.* Seven equal cells, `سبت` … `جمعة`. The current day is marked by
`border: 1px solid var(--color-accent)` and `--color-accent-700` text — an outline, no fill, consistent
with §1.2. It is the day selector.

*Timeline.* Rows of `[ 46px time, end-aligned ] [ 7px dot ] [ content ]`, joined by a 1px vertical rule
positioned `top: 16px; bottom: 0; right: 3px`, suppressed on the last row via
`.bayn-tl-row:last-child .bayn-tl-line { display: none; }`.

**The dot encodes the row's nature:**

| Dot | Meaning | Content treatment |
| --- | --- | --- |
| `var(--color-accent)` | a real event | heading face, weight 600 |
| `var(--color-neutral-400)` | a preparation task | body face, `opacity: 0.85` |

**Preparation tasks are first-class timeline rows** — `تحضير القاعة — نادي القراءة الصغير` at 9:30 for an
11:00 event; `تحضير — ورشة الخط العربي` at 16:00 for the 19:00 evening. The day reads as a rhythm of work,
not a list of events. **We have no data model for this** (see G3).

**Audience chips** sit under each event title:

| Design chip | Class | Domain value |
| --- | --- | --- |
| `للأطفال ٦–١٢` | `tag-neutral` | `audience: "children"` |
| `للفتيات ١٣–١٧` | `tag-outline` (in the calendar legend) / `tag-neutral` (in the timeline) | `audience: "youth"` |
| `للبالغات` | `tag-accent` | `audience: "adults"` |

**`EventAudience = "adults" | "youth" | "children"` already exists** in `lib/domain/types.ts:4` and is
already stored on every event. It is currently **not rendered anywhere in the admin UI.** This is the
cheapest high-value win in the entire plan.

Capacity renders as plain text beside the chip — `السعة ٢٨/٣٠` — not a progress bar.
`event.activeReservationCount` and `event.capacity` are both on the domain type already.

**Current state: there is no day view at all.** `AdminHub` renders a month grid and nothing else temporal.

### 2.3 Design pattern 3 — Contextual Calendar Layer (التقويم التفاعلي)

This is the clearest architectural instruction in the design.

**Trigger.** `<button class="btn btn-ghost btn-block" onClick="{{ openCalendar }}">عرض التقويم الكامل</button>`
— sitting in the **footer of the pulse rail**, after an `.hr`. A ghost button. The lowest-emphasis control
on the page.

**Layer.** `.dialog-backdrop` + `.dialog` at `width: min(640px, 100%)`. The month grid is
`display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px;` over a divider-colored background —
the borders-from-gap technique. Cells are `min-height: 58px`, day number top-left, and today is a 16px
outlined circle.

**Dismissal.** `onClick="{{ closeCalendar }}"` on the backdrop with `onClick="{{ stopClick }}"`
(`e.stopPropagation()`) on the dialog, plus an explicit `✕` icon button.

**Legend is by audience** — `للبالغات` / `للفتيات ١٣–١٧` / `للأطفال ٦–١٢` — not by item kind.

**The architectural message:** the calendar is neither a destination nor primary content. It is a
**reference you summon and dismiss.** The primary content is the work.

**Current state is the exact inverse.** `AdminHub.tsx:35`:

```
grid xl:grid-cols-[minmax(0,1.6fr)_minmax(19rem,0.85fr)]
```

The month calendar occupies `1.6fr` as the page's main content; the actual work — the attention queue —
is squeezed into a `0.85fr` sidebar. The design's ratio is `1.9fr` **for the work** and `1fr` for the pulse.

Our calendar is also colored by *kind* (`.calendar-item--event` / `--request` / `--booking`,
`app/globals.css:330-332`) rather than by audience.

**One thing we have that the design does not:** `buildCalendarItems` computes a real `conflictCount` by
interval overlap (`features/admin/calendar-items.ts`). That is genuine operational value — a booking
request colliding with an event — and **must survive the migration**. The design has no equivalent
because it has no conflicts in its fixture data.

**And one asset we already own:** `EventPanel.tsx` is a working, tested contextual overlay — native
`<dialog>` + `showModal()`, URL-backed via `?event=`, backdrop-click dismissal, focus returned to
`triggerId` on close, body scroll locked. **The contextual-layer pattern is already built here.** The
calendar overlay should reuse it, not reinvent it.

### 2.4 Microcopy and tone

| Dimension | Design | Current (`app/(dashboard)/admin/(protected)/page.tsx:34`) |
| --- | --- | --- |
| Greeting | `مساء الخير، ريم` — personal, time-aware | none |
| Title | `ما يحتاج عنايتك اليوم` | `اليوم` |
| Description | *"بين يديك اليوم أمسية أدبية تقترب من كمال عددها، وورشة للفتيات تنتظر تأكيد قائمة الانتظار، وخمس رسائل ضيوف تنتظر ردك الكريم."* | *"ابدئي بما يحتاج انتباهك الآن، ثم افتحي الفعالية أو الطلب المرتبط."* |
| Lexicon | عناية · ضيوف · أماسٍ خاصة · ردّك الكريم | مهام · تسجيلات · طلبات · معالجة |
| Nav | اليوم / الفعاليات / الضيوف / الأماسي الخاصة (top bar, 4 items, **no settings**) | اليوم / الفعاليات / التسجيلات / الطلبات / الإعدادات (sidebar, 5 items) |

The difference is not decorative. The current description **explains how to operate the interface**; the
design's description **summarises the state of the day**. Needing the former is itself a signal that the
interface does not explain itself.

The feminine grammatical address is preserved in both, consistent with `ADMIN_OVERHAUL_PLAN.md` §7.

### 2.5 Screen consolidation

The design implies fewer destinations, reached less often — consistent with the governing principle of
`ADMIN_OVERHAUL_PLAN.md`: *"a change that adds a screen, a tab, or a button must remove at least as much as
it adds."*

| Journey | Today | After |
| --- | --- | --- |
| Confirm a waitlist seat | `/admin` → expand → `/admin/registrations?view=waitlist&id=` → act | inline on `/admin` |
| Record a payment | `/admin` → `/admin/registrations?view=upcoming` → find → act | inline on `/admin` |
| Process a request | `/admin` → `/admin/requests` → select → act | inline for accept/review; overlay for detail |
| Check the month | already the main content | ghost button → overlay → dismiss |
| Open an event | `?event=` overlay ✅ already correct | unchanged |

Net: **no new routes, no new sidebar entries.** One new overlay (calendar), built on the existing overlay
primitive. Removed: the `<details>` disclosure pattern, and the navigation round-trip for the three most
frequent daily actions.

---

## 3. Architecture and state management

### 3.1 Current data and rendering model

`app/(dashboard)/admin/(protected)/page.tsx`:

```ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

const [events, registrations, requests] = await Promise.all([
  eventRepository.list(), registrationRepository.list(), requestRepository.list(),
]);
```

Three unbounded reads, then `buildAttentionGroups()` and `buildCalendarItems()` recompute in memory on
every request.

**At this data volume this is correct and must not be "optimised".** `ADMIN_OVERHAUL_PLAN.md` §3 is
unambiguous: ~9 events/month (ceiling 15), registrations self-limited to ~1,000 live rows by the 90-day
retention cron, **one** concurrent admin. Adding pagination here would be adding machinery, and machinery
is the disease. That section also names the real problem:

> *"The performance work that actually matters is not query optimisation … It is: fewer full-page
> navigations, real loading states, and fewer screens to walk through. Speed here is an **interaction
> design** problem, not a database problem."*

**This plan is the implementation of that sentence.**

### 3.2 The state problem

Every admin mutation today is a server action followed by `revalidatePath`, which re-runs the three
unbounded reads and re-renders the whole page. For a triage stream where the admin acts on five items in a
row, that is five full round-trips, five scroll-position losses, and five moments of dead interface.

`ADMIN_OVERHAUL_PLAN.md` finding **A4** already records this: *"Every action discards search / page /
selection."*

**Target model — Server Components for data, Client Components for the action boundary only:**

```
page.tsx (RSC)                     three repository reads, unchanged
  └── buildTriageItems()           pure, testable, no React
  └── <TriageStream>       (RSC)   maps items → cards
        └── <TriageCard>   (RSC)   layout, icon, copy — no interactivity
              └── <TriageActions>  ("use client")  ← the ONLY client boundary
                     useActionState   pending state, server-action result
                     useOptimistic    item disappears / updates the instant it is clicked
```

Only `TriageActions` ships JavaScript. The card, its copy, its icon and its layout stay server-rendered.

**Optimistic behaviour, precisely:**

| Action | Optimistic effect | On server failure |
| --- | --- | --- |
| `تأكيد الدعوة` | row animates out; counter decrements | row returns, `ToastProvider` shows the error |
| `إعادة للقائمة` | row animates out | as above |
| `متابعة الدفع` | the payment tag flips state in place | tag reverts |
| `مراجعة الطلب` | opens the overlay (no mutation) | n/a |

`ToastProvider` already exists (`components/ui/ToastProvider.tsx`) and is already mounted in both the
protected layout and `EventPanel` — the failure path needs no new machinery.

**Serialization constraint.** Commit `171da45` (`fix(admin): resolve RSC serialization error by passing
serializable href map to RegistrationTable`) records a real hazard on this exact seam. `TriageItem` must
therefore be **plain serializable data** — strings, numbers, and a discriminated `actionId` union. **No
functions on the item.** The client component maps `actionId` → imported server action, exactly as
`EventPanelHost.tsx` already does with its `registrationActions` map. That existing pattern is the model to
follow.

### 3.3 Logic / presentation separation

The repo's existing convention is already correct and simply needs to be extended:

- `lib/domain/` — provider-neutral types and validation. **Unchanged by this plan.**
- `lib/supabase/` — the adapter boundary. `Database` generated types must not leak out. **Unchanged.**
- `features/admin/*.ts` — pure derivation functions, no React, colocated `*.test.ts`. This is where
  `attention-items.ts` and `calendar-items.ts` already live, and where the new logic belongs.
- `features/admin/components/*.tsx` — presentation.

**Domain model change — `attention-items.ts`:**

```ts
// removed
interface AttentionGroup { id; tone; title; deadline; members: AttentionMember[] }
interface AttentionMember { id; description; href; deadline }

// added
type TriageIcon   = "clock" | "envelope" | "card" | "chat" | "draft" | "seat";
type TriageAction =
  | { kind: "confirm-invitation";  variant: "primary";   registrationId: string }
  | { kind: "revoke-invitation";   variant: "secondary"; registrationId: string }
  | { kind: "record-payment";      variant: "primary";   registrationId: string }
  | { kind: "open-request";        variant: "primary";   requestId: string }
  | { kind: "open-event";          variant: "primary";   eventId: string; section?: string };

interface TriageItem {
  id: string;
  icon: TriageIcon;
  subjectName: string;      // the person — the headline
  urgencyLabel: string;     // "تنتهي الدعوة خلال ٤٠ دقيقة"
  urgencyTone: "urgent" | "warning" | "neutral";
  context: string;          // the self-sufficient sentence
  actions: readonly TriageAction[];
  deadline: number;         // sort key — priority logic preserved verbatim
}
```

The seven priority sources and the `deadline` sort are **preserved exactly**. What changes is the shape of
the output and the loss of the grouping step. `attention-items.test.ts` is extended, not replaced.

**New modules:**

| Path | Kind | Responsibility |
| --- | --- | --- |
| `features/admin/day-pulse.ts` | pure | `(events, requests, day) → PulseRow[]` |
| `features/admin/day-briefing.ts` | pure | the narrative day-summary sentence |
| `features/admin/relative-time.ts` | pure | minute-precision Arabic deadline labels (fixes B4) |
| `features/admin/components/TriageStream.tsx` | RSC | the stream |
| `features/admin/components/TriageCard.tsx` | RSC | one card |
| `features/admin/components/TriageActions.tsx` | client | the only interactive boundary |
| `features/admin/components/DayPulse.tsx` | RSC | the rail |
| `features/admin/components/WeekStrip.tsx` | RSC | day selector (`?day=` links) |
| `features/admin/components/AudienceChip.tsx` | RSC | shared by pulse and calendar |
| `features/admin/components/Overlay.tsx` | client | **extracted** from `EventPanel.tsx` |
| `features/admin/components/CalendarOverlay.tsx` | RSC | month grid inside `Overlay` |

**Net file change: +11 new, −0 deleted, but `EventPanel.tsx` shrinks to a thin wrapper over `Overlay`,
removing the duplication that a second hand-written dialog would otherwise create.**

**A deliberate non-goal:** no client-side state manager. All navigational state stays in the URL
(`?month=`, `?day=`, `?event=`, `?calendar=`), matching the pattern already used throughout the admin.
`useOptimistic` covers the transient gap between click and revalidate. Nothing else is needed at this
volume.

### 3.4 Motion

`app/globals.css` already defines `--duration-micro: 120ms`, `--duration-standard: 200ms`,
`--duration-panel: 320ms` and `--ease-standard`, with a comment stating they are *"not yet wired into
transitions/animations — that lands component-by-component in a later phase."* **This is that phase.**
Optimistic removals need a real exit transition, and a `prefers-reduced-motion` guard.

### 3.5 RTL correctness

The design file is `dir="rtl"` but uses several physical properties that must **not** be copied verbatim:

| In the design | Must become |
| --- | --- |
| `right: 3px` (timeline rule) | `inset-inline-start: 3px` |
| `text-align: right` (time column) | `text-align: end` |
| `border-left` (`.seg-opt + .seg-opt`) | `border-inline-start` |
| `margin-right: auto` (`.nav-brand`) | `margin-inline-end: auto` |
| month-nav arrow paths (`M9 6l6 6-6 6` = previous) | verify against our own direction, do not assume |

`app/globals.css` already uses logical properties correctly in places (`border-inline-start`,
`inline-size`, `padding-inline`). The new components must be logical-only.

---

## 4. Implementation roadmap

Incremental, small steps, each independently verifiable. Per `AGENTS.md` §12/§20, every phase gate is
`pnpm lint && pnpm typecheck && pnpm test && pnpm build`, in addition to the phase-specific criteria below.

### Phase 0 — Token foundation

**Not started.** Unblocked. Per **D1**, the club palette stays and only Classical's structural discipline
is adopted. Per **D2/D3**, the type layer is not touched at all.

Phases 1–5 shipped first, per the roadmap's own recommended order, and every new component built for them
reuses the *current* tokens as-is — `.triage-card`'s border/shadow, `.calendar-overlay`'s radius, the
`.audience-chip`/`.triage-card__tag` colors all read `--color-border`, `--radius-surface`,
`--color-error-bg`, and so on, unchanged. None of the six items below have been done. The stroke-over-fill
direction in particular (item 6) would visibly change `.button-primary` and `.card-surface`, which by now
are used throughout the finished Phase 1–4 work — worth a deliberate look before touching it, not a
same-session follow-on.

Changes confined to `app/globals.css`:
1. Add OKLCH-generated 100–900 ramps derived from `--brand-forest #204f28`, `--brand-olive #708a58` and
   `--brand-amber #ffb623`. **No gold `#b68235` enters the codebase.**
2. Replace the raw `#596bab` (`:326`, `:332`) with a ramp step.
3. Convert `--color-border` to a `color-mix()` transparent divider.
4. Retune `--radius-control` / `--radius-surface` toward the 4px scale.
5. Lighten the shadow scale.
6. Convert `.button-primary` and `.card-surface` from solid fills to the stroke-over-fill treatment.

**Out of scope for this phase, by decision:** font family, font weights, and the type scale. `bd389ae`
stands; no `--font-weight-heading` ceiling token is introduced.

**Acceptance criteria**
- No `.tsx` file is modified in this phase.
- No raw hex remains in `app/globals.css` outside the `:root` definitions.
- Full visual pass of the **public** site (tokens are shared) — no unintended regression.
- Contrast: body text ≥ 4.5:1; accent-on-ground ≥ 3:1 for chrome, with a 700-step for accent body text.

### Phase 1 — Action Triage Stream

**The highest-value phase. Independent of D1 — it can ship before Phase 0.**
Partially blocked on **G1** for the confirm-invitation action.

1. Refactor `features/admin/attention-items.ts` to emit `TriageItem[]` (§3.3). Priority logic preserved.
2. Add `features/admin/relative-time.ts` for minute-precision Arabic labels.
3. Build `TriageStream` / `TriageCard` / `TriageActions`.
4. Wire `setRegistrationPaymentStatusAction`, `revokeInvitationAction` and request navigation inline.
5. Delete the `<details>` grouping path and its CSS (`app/globals.css:277-285`).

**Acceptance criteria**
- Every item in the stream is a card headlined by a **person or event name**, never a category.
- Every item exposes **at least one inline action** or is not shown. No `←` navigation-only rows.
- Confirming a payment takes **one click** and causes **zero full page loads**.
- Optimistic update renders in < 100 ms; a server failure reverts the row and raises a toast.
- No `<details>` remains in the admin hub; keyboard traversal is tab-only and focus is visible.
- `attention-items.test.ts` covers all seven sources plus every `TriageAction` variant.
- Priority ordering is byte-identical to today's for the same fixture input.

**Implementation note — 2026-08-30.** Shipped as `features/admin/attention-items.ts` (`TriageItem[]`),
`relative-time.ts`, `TriageStream.tsx`/`TriageCard.tsx`, and `app/globals.css`'s `.triage-card*` rules
replacing `.attention-item*`. G1 was closed with a new admin-gated RPC,
`admin_accept_waitlist_invitation` (migration `20260830090000`, pgTAP-covered but **not yet run** — no
`supabase` CLI in the build environment; run `pnpm test:db` before applying it to the hosted dev
project), wired through `confirmInvitationAction` and also surfaced on `RegistrationTable`'s own
invited-row actions.

One criterion above did not survive contact with the data model as written: **"confirming a payment"
is not one inline click.** `setRegistrationPaymentStatusAction` takes an explicit
`deposit_paid`/`paid_in_full` choice with no single correct default, so inventing a one-click "next
status" would have been a guessed business rule. The payment, reminder, confirmation, draft, and seat
categories all resolve to a precisely-targeted `link` action instead (e.g. straight to the registration's
payment form, or the event's communications/settings section) — real destinations, not the old
mis-targeted or list-level links, but a navigation rather than a mutation. Only the waitlist-invitation
category (`confirm-invitation` / `revoke-invitation`) is a true one-click, zero-navigation action. This
is the honest outcome, not a shortfall to revisit — a real one-click payment action would need a product
decision on a default status first.

### Phase 2 — Today's Pulse

Unblocked. Per **D5a**, the timeline shows **real events and scheduled requests only**. No derived or
invented preparation rows. The design's two-tone dot therefore encodes something we actually have:
`--color-accent` for a published event, a neutral step for a draft or a scheduled booking request.

1. `features/admin/day-pulse.ts` — pure, tested.
2. `AudienceChip.tsx` reading `event.audience`.
3. `DayPulse.tsx` + `WeekStrip.tsx`, day selection via `?day=`.

**Acceptance criteria**
- The three audiences render distinctly and correctly for every event.
- Capacity reads `السعة ٢٨/٣٠` in Arabic-Indic digits via the existing `formatArabicNumber`.
- Day selection changes only the URL — no client state, back button works.
- All times render in `Asia/Riyadh` through `lib/format/date.ts`, from UTC-stored instants.
- Timeline rule uses logical properties and is correct at 320px, 768px and 1440px.
- `day-pulse.test.ts` covers empty days, single-event days, and overlapping items.

**Implementation note — 2026-08-30.** Shipped as `features/admin/day-pulse.ts` (built on top of
`buildCalendarItems`, which gained an optional `audience` field for event-kind items),
`AudienceChip.tsx`, `WeekStrip.tsx`, and `DayPulse.tsx`, all with component/unit tests. Audience labels
reuse the admin's own existing vocabulary (`الكبار`/`اليافعون`/`الصغار` from `EventForm.tsx`) rather than
the design's gendered phrasing (`للبالغات`/`للفتيات`), consistent with D5b's "keep standard terminology."
The timeline includes accepted/under-review/new service requests alongside events (matching
`buildCalendarItems`' existing scope) rather than events only, since D5a rules out inventing anything
*not* in that already-approved scope — a scheduled booking is real operational time on that day. These
components are **not yet mounted on `/admin`** — that composition (together with the grid inversion and
the calendar overlay) is Phase 3's job by design, so the page isn't rewired twice.

### Phase 3 — Layout inversion and contextual calendar

Depends on Phases 1 and 2.

1. Invert the grid to `1.9fr / 1fr` — triage primary, pulse secondary.
2. **Extract `Overlay.tsx` from `EventPanel.tsx`**; refactor `EventPanel` to consume it. No behaviour change.
3. Build `CalendarOverlay` on `Overlay`, opened by a `btn-ghost` in the pulse footer, URL-backed as `?calendar=1`.
4. Recolor calendar items by **audience**; keep `conflictCount` as a distinct, non-audience marker.

**Acceptance criteria**
- `EventPanel`'s existing tests pass unchanged after the extraction — proving no behaviour change.
- The calendar overlay closes on backdrop click, `✕`, and `Esc`; focus returns to the trigger.
- `?calendar=1` survives a reload and a back-navigation.
- `conflictCount` warnings are still visible and still correct (`calendar-items.test.ts` unchanged).
- No second hand-written `<dialog>` exists anywhere in `features/admin/`.

**Implementation note — 2026-08-30.** All four items shipped. `Overlay.tsx` carries the shared dialog
lifecycle (open on mount, close on backdrop click **or Escape** — both fire the native `<dialog>`
`"close"` event, which is all the hook ever listened for, so Escape worked before this refactor too and
needed no new code); `EventPanel.tsx` and the new `CalendarOverlay.tsx` are thin class-only skins over it.
`EventPanel.test.tsx` passes byte-for-byte unchanged. `AdminHub` is now `1.9fr` triage / `1fr` pulse, with
Today's Pulse and its "عرض التقويم الكامل" link finally mounted (Phase 2's components were built but not
wired until now). `CalendarMonthGrid` recolors event items by audience
(`.calendar-item--adults/youth/children`, sharing `AudienceChip`'s color mapping) everywhere it's used —
including `/admin/events`'s own calendar view, not just this overlay — while request/booking items keep
their kind-based colors and `conflictCount` still overrides both as a top-priority marker.
`calendar-items.test.ts`'s existing assertions are unchanged; one new test was added for the `audience`
field itself. `?calendar=1` and `?day=` are independent, sibling search params (mirroring the existing
`?event=` pattern), so both survive a reload or back-navigation via ordinary Next.js routing — no client
state involved.

### Phase 4 — Editorial header and microcopy

Unblocked. Per **D5b**, the sidebar and lexicon are unchanged — this phase is the header and the summary
sentence only, in existing terminology (التسجيلات، الطلبات).

1. `features/admin/day-briefing.ts` — the narrative summary sentence.
2. `DayBriefing.tsx` — time-aware greeting + `ما يحتاج عنايتك اليوم` + the sentence.
3. Copy pass per `ADMIN_OVERHAUL_PLAN.md` §7, feminine address preserved.

**Acceptance criteria**
- The summary is generated from live data and is grammatically correct for 0, 1, 2, and n items
  (Arabic dual and plural forms are handled — this needs explicit test cases).
- No instructional copy ("ابدئي بـ…") remains in the hub header.
- Terminology changes are applied **only** if D5 approves them, and then consistently across admin and
  public surfaces.

**Implementation note — 2026-08-30.** Shipped as `features/admin/day-briefing.ts`
(`buildGreeting`/`buildDaySummary`), with `lib/format/date.ts` gaining a `formatTaskCount` counter
alongside the existing `formatEventCount`. No separate `DayBriefing.tsx` was built: the existing
`PageHeader` component (`components/ui/PageHeader.tsx`) already renders exactly this eyebrow/title/
description shape, so `page.tsx` now passes it the greeting, the fixed title, and the computed summary
directly — adding a wrapper component would only have duplicated that markup.

The greeting carries no name (`مساء الخير` alone, not `مساء الخير، ريم`): `requireAdmin()` returns only
`{ id, email }`, and no display-name field exists on `admin_users`. Inventing one, or using the email's
local part, would be guessing at a product decision this plan doesn't cover.

The summary sentence is deliberately built without any verb or preposition governing the numbered count
itself (`formatEventCount`/`formatTaskCount` return the *nominative* dual for a count of two —
`"فعاليتان"` — which is only grammatically correct as a subject, e.g. `"أمامك اليوم فعاليتان"`; a verb
like `"فعاليتان تحتاج..."` or a preposition would need the case or the verb's number to change with the
count). All four quadrants (0/0, events-only, tasks-only, both) are covered in
`day-briefing.test.ts`, including the dual case for each counted noun.

### Phase 5 — Motion, accessibility, RTL hardening

1. Wire `--duration-*` / `--ease-standard` into card, overlay and optimistic-exit transitions.
2. `prefers-reduced-motion: reduce` guard on all of them.
3. Full logical-property audit of every new component (§3.5).
4. System-level `:focus-visible` per §1.3.

**Acceptance criteria**
- No hard-coded duration or easing in any `.tsx` or in the new CSS.
- With reduced motion enabled, no transform or opacity animation runs.
- Keyboard-only traversal of the hub reaches every action, in visual order, with a visible focus ring.
- Screen-reader pass: the stream is a list; each card announces subject, urgency and available actions.
- Rendered correctly at 320 / 768 / 1440px in RTL.

**Implementation note — 2026-08-30.**

*Motion.* Two already-global, app-wide rules did most of this phase's job before any new code was
written: a bare `:focus-visible { outline: 3px solid ...; box-shadow: ...; }` (no scoping — every
interactive element in the new components inherits it, and none of the new CSS overrides `outline`),
and a `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0.01ms
!important; ... } }` that already neutralizes every transition on `.triage-card`, `.calendar-overlay`,
`.event-panel`, and `.week-strip` regardless of which stylesheet rule set the duration. What remained was
tokenizing the durations themselves: `.event-panel` and the new `.calendar-overlay` both had hard-coded
`220ms`/`320ms` transition values (copied from the original `.event-panel` when `.calendar-overlay` was
built in Phase 3) — both now use `var(--duration-standard)`/`var(--duration-panel)`. Every other new rule
(`.triage-card`, `.week-strip__day`) was already token-based when first written.

One item from the roadmap did **not** ship: an animated fade-out when `TriageStream` removes an item.
Building one correctly would mean tracking "still optimistically present" and "visually leaving" as two
separate pieces of state (a removed React node cannot itself animate — the transition has to play before
the node leaves the tree), which risks state-sync bugs — a stale removal timer firing after
`router.refresh()` brings fresh server data, for instance — in exchange for a cosmetic gain. `RegistrationTable`'s
existing optimistic removals (the pattern `TriageStream` deliberately copied) have never had one either.
Rows still disappear instantly on success, which is correct and fast — just not animated.

*Accessibility.* `TriageStream`'s wrapper is now a real `<ul aria-label="قائمة المهام">`, and `TriageCard`
renders as `<li aria-label="{subject} — {urgency}">` instead of a bare `<article>` — a screen reader in
list-navigation mode now announces the subject and urgency for each item before reaching its actions
(covered by a new AdminHub test asserting `role="list"`/`role="listitem"` and the composed accessible
name). `DayPulse`'s timeline was already a real `<ol>`/`<li>` from Phase 2.

*RTL.* Every component built or touched in Phases 1–4 (`TriageCard`, `TriageStream`, `DayPulse`,
`WeekStrip`, `AudienceChip`, `Overlay`, `CalendarOverlay`, `AdminHub`) was grep-audited for
physical-direction properties — `left`/`right`/`top`/`bottom`, `margin-`/`padding-left/right/top/bottom`,
`border-l/r`, `text-align: left/right`, and the equivalent Tailwind utilities. Four were found and fixed:
`.week-strip`'s `margin-bottom`, `.pulse-timeline__line`'s `top`/`bottom`, `.pulse-timeline__time`'s
`padding-top`, `.pulse-timeline__dot`'s `margin-top`, and both overlays' `.event-panel__close`/
`.calendar-overlay__close` using `top: 0` for a `position: sticky` offset — all converted to their
block-axis logical equivalents (`margin-block-end`, `inset-block-start`, `padding-block-start`,
`margin-block-start`). Pre-existing physical-direction classes elsewhere in the codebase
(`CalendarMonthGrid`'s own `border-r-4`, predating this redesign; `PageHeader`'s `pr-5`) were left alone —
retrofitting the whole admin surface is out of this plan's scope, and the acceptance criterion itself
reads "every **new** component."

*Responsive breakpoints.* Verified by static review, not a rendered viewport: `.triage-card` and
`.pulse-timeline__row` both use `flex-wrap`/`min-width: 0` so content shrinks or wraps rather than
overflowing, `.week-strip__day` is `flex: 1` so its seven cells always divide the available width, and
`.calendar-overlay` already had a `max-width: 40rem` breakpoint from Phase 3. This was not confirmed in an
actual browser at 320/768/1440px — this session had no authenticated admin session of its own to drive
one. If you have the dev server's tab open, a manual resize is the one item from this phase's acceptance
criteria that's worth your own eyes on.

### Sequencing and risk

| Phase | Value | Risk | Blocked by | Touches public site |
| --- | --- | --- | --- | --- |
| 0 Tokens | High | **Medium** | — | **Yes** (color/radius/shadow only) |
| 1 Triage | **Highest** | Low | G1 — built in-phase | No |
| 2 Pulse | High | Low | — | No |
| 3 Layout + calendar | Medium | Low | 1, 2 | No |
| 4 Copy | Medium | Low | — | No |
| 5 Motion + a11y | Low | Low | all | Shared CSS only |

**Recommended order: 1 → 2 → 3 → 0 → 4 → 5.**

Phase 1 is entirely independent of the palette decision and delivers the single largest behavioural
improvement. Starting there means real progress while D1–D3 are still open, and it keeps the risky,
public-site-touching token work until after the new components have settled and can be re-checked against it.

**What actually happened:** 1 → 2 → 3 → 4 → 5, with Phase 0 skipped rather than slotted in after 3 as
recommended. By the time Phase 3 was done, D1–D3 had already been decided (keep the palette, keep the
type layer) and every component from Phases 1–3 already worked correctly against the *existing* tokens —
so there was no longer a specific moment where doing Phase 0 next was clearly better than continuing
straight to the copy pass. It is still the one phase from this plan that has not been touched.

---

## 5. Gaps requiring new data or actions

| # | Gap | Evidence | Impact |
| --- | --- | --- | --- |
| **G1** | No `confirmInvitationAction` | `EventPanelHost.tsx:20-26` passes `revokeInvitationAction` but no confirm. This is finding **A7** in `ADMIN_OVERHAUL_PLAN.md`: *"Waitlist invitation flow has no UI"*, severity 🔴 Critical | Blocks the design's **primary** triage action. Must be built in Phase 1 |
| ~~**G2**~~ | ~~No inbound-message model~~ | `ManualMessageRecord` is outbound-only | **Closed by D4** — the "awaiting reply" card is dropped. No inbound model will be built |
| ~~**G3**~~ | ~~No preparation-task model~~ | `lib/domain/types.ts` `Event` interface | **Closed by D5a** — prep rows are dropped. The timeline renders real events and scheduled requests only |
| **G4** | `bayn_trip` not visually distinguished | `EventKind` exists; the design colors `رحلة إلى العلا` as an ordinary event | Minor. Recommend keeping the audience-only legend for now |

---

## 6. Decisions — resolved

Finalized by the product owner on **2026-08-30**. Recorded here as the authoritative answer; supersedes the
open questions previously posed in this section.

| # | Question | Decision |
| --- | --- | --- |
| **D1** | Palette | **Keep the approved club palette** (forest / olive / amber) and adopt only Classical's structural discipline: OKLCH 100–900 ramps, stroke-over-fill, 4px radius, whisper elevation. Classical's gold `#b68235` is rejected. |
| **D2** | Typography | **Keep `--font-thmanyah-sans` across all surfaces.** Amiri / Noto Naskh Arabic are not introduced. |
| **D3** | Weights | Folded into D2: **the type layer is left as-is.** Commit `bd389ae` stands; Classical's semibold-600 ceiling is not adopted. |
| **D4** | Inbound messages | **Drop the inbound-message triage card.** Build strictly against currently available data models. Closes G2. |
| **D5a** | Preparation tasks | **Timeline shows real events and reservations only.** No artificial or derived prep rows. Closes G3. |
| **D5b** | Navigation and lexicon | **Retain the current five-item sidebar and existing terminology** (اليوم / الفعاليات / التسجيلات / الطلبات / الإعدادات). No rename to الضيوف / الأماسي الخاصة. |

### Consequences

- **The identity is not split.** `/admin` and the public site keep one palette and one typeface. Phase 0 is
  reduced to color structure, radius and elevation — it no longer touches type at all, which materially
  lowers its risk rating.
- **The triage stream ships with four card types, not five:** expiring waitlist invitation, private-space
  request, pending payment, and unready draft / open seat. The WhatsApp-reply card is out.
- **The pulse timeline is honest.** It renders what the database knows. The design's two-tone dot is
  repurposed to distinguish a published event from a draft or a scheduled booking request, rather than to
  distinguish an event from an invented prep task.
- **No public-surface copy changes.** Phase 4 is confined to the admin hub header.
- **G1 remains the only real gap** and is built inside Phase 1.

### One flagged reading

D2 and D3 were answered together as "keep `--font-thmanyah-sans` across all surfaces." That answers the
*family* directly. D3 asked about the *weight ceiling*. It is read here as **leave the type layer
untouched, weights included** — the conservative interpretation, and the one that preserves `bd389ae`.
If the intent was instead to adopt the semibold ceiling while keeping Thmanyah, say so and Phase 0 grows
by one token and a weight pass.

---

## 6a. Post-implementation fixes — calendar overlay (2026-08-30)

Real use of the finished overlay (not this session's own testing — this session has no admin
credentials) surfaced two rounds of layout bugs the acceptance criteria above didn't catch:

**Round 1 — clipping.** `.calendar-overlay` and `.calendar-overlay__body` each carried their own
`max-height`, with only the inner one scrolling. Fixed by moving the scroll boundary to the dialog
itself alone: `.calendar-overlay { max-height: 90vh; display: flex; flex-direction: column;
overflow-y: auto; width: min(880px, 94vw); }`, with `.calendar-overlay__body` reduced to a plain
block (no competing max-height/overflow). Cell `min-height` dropped from Tailwind's default
`min-h-32` (128px) to 90px, scoped to `.calendar-overlay [role="grid"] > div` only — the standalone
`/admin/events` calendar view keeps its original size.

**Round 2 — the real bug.** What looked like "day 1 far left, day 2 jumping to the far right" was
`CalendarMonthGrid`'s week actually starting on **Sunday** (`weekDays[0] = "الأحد"`,
`firstDayOffset = getUTCDay()`) while `WeekStrip` (Phase 2) starts on **Saturday** — an inconsistency
this plan's Phase 5 RTL audit noted and deliberately left alone as "not evidenced as broken." Sunday-first
reading right-to-left is internally consistent (verified against `getUTCDay()`) and not itself a
rendering bug, but it produces exactly this symptom whenever a month starts on a Saturday (this
session's own August 2026 fixture is one): day 1 sits alone in the last column of row 1, and day 2
starts an entirely new row — reading right-to-left, you meet day 2 before you meet day 1. Fixed by
switching `CalendarMonthGrid` to the same Saturday-first order as `WeekStrip`
(`firstDayOffset = (getUTCDay() + 1) % 7`, exactly `day-pulse.ts`'s `weekOf()` conversion), so the two
calendars in this admin now agree on where a week starts.

**Also fixed, same round:** the header was rebuilt as a single real flex row — `Overlay.tsx` gained an
optional `headerContent`/`headerClassName` prop pair so the close button can be a genuine flex sibling
of a consumer's own header content instead of a separately-positioned corner element;
`EventPanel` doesn't pass it, so its markup and tests are byte-for-byte unchanged. `CalendarMonthGrid`
gained a `showTitle` prop (default `true`) so the overlay's own header can show the month title once,
in the new header row, instead of twice.

---

## 7. What is explicitly preserved

Carried forward unchanged, to prevent regression during the migration:

- **The governing principle** — a change that adds a screen, tab or button must remove at least as much.
- **No pagination.** `ADMIN_OVERHAUL_PLAN.md` §3 downgraded A5 to 🟡 Low deliberately. Do not reintroduce it.
- **The seven-source priority logic and its `deadline` ordering** in `attention-items.ts`.
- **`conflictCount`** in `calendar-items.ts` — operational value the design does not have.
- **`EventPanel`'s overlay behaviour** — extracted, not rewritten.
- **Server-side authorization in every action.** `proxy.ts` is not an authorization boundary; `requireAdmin()`
  stays in every server action and page.
- **Arabic-only, RTL, feminine address** across all user-facing copy.
- **`lib/domain/` and `lib/supabase/` boundaries** — no generated `Database` types leak into `features/`.
