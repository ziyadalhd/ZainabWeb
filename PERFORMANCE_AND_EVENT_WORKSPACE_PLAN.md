# Performance, Data Fetching & Event Workspace Refactor

Status: implemented on `codex/product-quality-polish`.
Scope: admin dashboard routes (`app/(dashboard)/admin/(protected)/**`) and the event
management workspace (`EventPanel` / `EventPanelHost` / `EventWorkspaceContent`).

---

## 1. Problem statement

Two independent bottlenecks were reported, and the audit confirmed both.

### 1.1 Navigation feels dead

Every admin surface is a single `async` Server Component that awaits *all* of its data
before emitting *any* HTML. There is no `<Suspense>` boundary anywhere under
`app/(dashboard)/admin/`, so the only loading affordance is the route-level
`loading.tsx`, which blanks the entire page.

The worst case is the event panel. Opening an event is a `searchParams`-only
navigation (`/admin/events?event=<id>`). Next.js re-runs the whole page segment, so
one click re-fetches the full event list *and* the service-request list *and* the
whole event workspace before anything paints. Between click and paint the UI shows
either nothing or a full-page skeleton — the reported "dead click" and "full-page
blocking".

### 1.2 Sequential waterfalls

Measured request chains before the change:

| Route | Chain |
| --- | --- |
| `admin/page.tsx` | `requireAdmin` → `Promise.all(searchParams, eventRepo, requestRepo)` → **`createAdminRegistrationRepository()`** (awaited alone) → `Promise.all(list × 3)` |
| `admin/events/page.tsx` | `requireAdmin` → `Promise.all(searchParams, eventRepo)` → **`eventRepository.list()`** → **`createAdminServiceRequestRepository()`** → **`.list()`** |
| `EventPanelHost` | `Promise.all(3 repos)` → **`eventRepository.get(id)`** → `Promise.all(5 queries)` |

Three avoidable serial hops. `EventPanelHost` is the most expensive: `get(id)` gates
five queries that only need the `id` from the URL, which the host already has.

### 1.3 Event workspace craft

`EventWorkspaceContent` stacks five `<section>` elements down one 48rem drawer, each
with a `border-block-start` + `mt-8` physical margin, an inline-start bar on every
heading, and an anchor-link "nav" that is not a real tab set. Capacity, price and
status are crammed into one `.workspace-status` flex line. Nested `card-surface`
elements inside `RegistrationTable` sit inside those bordered sections, producing the
reported double borders and boxes-inside-boxes.

---

## 2. Approach

### 2.1 Caching: what changes and what deliberately does not

`export const dynamic = "force-dynamic"` **stays** on every authenticated admin route.
These pages read `cookies()` via the Supabase server client and render per-admin,
per-request operational data; caching them would be a correctness and privacy defect,
not an optimisation. What is removed is the redundant `export const revalidate = 0`
that accompanies it on every admin file — `force-dynamic` already implies it, and the
pair invites the misreading that a cache is being defeated when none exists.

The latency win therefore comes from **streaming**, not from caching: send the shell
immediately and let each data region resolve independently.

### 2.2 Granular Suspense + skeletons

New `components/ui/Skeleton.tsx` provides `Skeleton`, `SkeletonText` and
`SkeletonCard` built from Classical tokens (`--color-border`, `--color-surface`,
`--radius-control`, `--radius-surface`, `--duration-*`) so placeholders share the
page's palette instead of grey boxes.

Boundaries added:

- `admin/page.tsx` — the hub body and the event panel each get their own boundary, so
  the greeting/header paints instantly.
- `admin/events/page.tsx` — the list/calendar body and the event panel each get their
  own boundary. Opening an event now paints the list immediately and streams the
  inspector into the drawer behind `EventInspectorSkeleton`.

Because the panel is its own boundary, the drawer chrome (backdrop, close button,
title) renders on the first flush and the body fills in — the click is visibly
acknowledged in one frame.

### 2.3 Waterfall removal

- `admin/page.tsx`: all three repositories are created in one `Promise.all`, then all
  three `list()` calls in a second. Two round trips total.
- `admin/events/page.tsx`: both repositories and both lists resolve in parallel; the
  service-request list is only *used* in calendar view but is no longer a serial hop.
- `EventPanelHost`: extracted to `features/admin/event-workspace.ts`. All six queries
  (`get`, `listForEvent`, `listSubmittedForEvent`, the two templates,
  `listManualMessagesForEvent`) fan out from the URL `id` in a single `Promise.all`;
  the existence check happens on the resolved result instead of gating the fan-out.
  Six serial-then-parallel round trips collapse to one.

### 2.4 Optimistic, non-blocking mutations

`RegistrationTable` already applied `useOptimistic` to its mutations. The remaining
blocking interaction was **selection**: picking a roster row was a `<Link>`
navigation that re-rendered the entire server page. Selection is now local state
(`useState`), with the `href` retained so rows stay deep-linkable, focusable and
usable without JS; the click handler calls `preventDefault()` and swaps the detail
pane in the same frame.

---

## 3. Event Inspector redesign

The referenced `Event Inspector.dc.html` is **not present in this repository or on
this machine**, so the layout below is derived from the existing Classical token
system and the brief's own description (calm header, master-detail, tabs, sticky
capacity rail). If that file is added, the visual details here should be reconciled
against it.

### 3.1 Structure

```
.event-inspector
├── .event-inspector__header      calm: eyebrow · title · date · lifecycle badge · quick actions
└── .event-inspector__layout      grid — [main minmax(0,1fr)] [rail 20rem]
    ├── main
    │   ├── .event-inspector__tabs      role="tablist", arrow-key roving focus
    │   └── .event-inspector__panel     role="tabpanel", one section at a time
    └── aside .event-inspector__rail    position: sticky
        ├── capacity card  — meter + seats remaining
        ├── revenue card   — price × active reservations
        └── metadata card  — audience, type, registration status
```

Tabs: `roster` (قائمة الحضور والتسجيلات), `waitlist` (قائمة الانتظار),
`communications` (التواصل والتذكير), `feedback` (التقييمات), `settings` (الإعدادات).
The waitlist tab surfaces the remaining-seat counter and the invite trigger at the top
of its panel, above the table.

### 3.2 Visual rules enforced

- No nested bordered boxes: the inspector's panel is a flat surface; the tables inside
  it own their own chrome and no longer sit inside a second bordered `<section>`.
- No physical margin hacks (`mt-8` chains, `border-block-start` separators): spacing
  comes from `gap` on the grid/flex containers.
- Strict RTL logical properties throughout (`inset-inline-*`, `padding-inline-*`,
  `margin-block-*`); no `left`/`right`/`margin-left` anywhere in the new CSS.
- Panel widened from `48rem` to `min(76rem, 96vw)` so master-detail plus the rail fit
  without horizontal compression.

### 3.3 OKLCH meter tokens

`--meter-track`, `--meter-fill`, `--meter-fill-warn`, `--meter-fill-full` are
redefined in OKLCH on one lightness/chroma progression so the three tones read as one
family and step evenly, and `--meter-height` / `--meter-height-lg` are added so the
inline card meter and the rail meter share one definition.

---

## 4. Files

**Added**
- `components/ui/Skeleton.tsx` — `Skeleton`, `SkeletonText`, `SkeletonCard`
- `features/admin/admin-lists.ts` — request-scoped, `cache`d list loaders
- `features/admin/event-workspace.ts` — the parallelised inspector loader
- `features/admin/event-revenue.ts` (+ test) — expected revenue and settlement counts
- `features/admin/components/EventInspector.tsx` — header, rail, tab host
- `features/admin/components/EventInspectorTabs.tsx` — accessible tabs (client)
- `features/admin/components/EventInspectorSkeleton.tsx` — the panel's Suspense fallback
- `features/admin/components/EventInspector.test.tsx`
- `features/admin/components/EventInspectorTabs.test.tsx`

**Changed**
- `app/(dashboard)/admin/(protected)/page.tsx` — `HubSection` / `CalendarSection` behind their
  own boundaries; three repositories then three lists, two round trips total
- `app/(dashboard)/admin/(protected)/events/page.tsx` — `EventsBody` behind its own boundary,
  keyed on the filter params so a filter change shows the skeleton while opening the panel does
  not disturb the list
- `features/admin/components/EventPanelHost.tsx` — split into `EventPanelBody` (data, streamed)
  and `EventPanelHost` (drawer + body, for non-streaming callers)
- `features/admin/components/EventPanel.tsx` — unchanged API; the panel is widened in CSS
- `features/admin/components/RegistrationTable.tsx` — local selection state
- `app/globals.css` — OKLCH meter tokens, `.skeleton*`, `.event-inspector*`, panel widened to
  `min(76rem, 96vw)`; the now-dead `.event-panel__header`, `.event-panel__section`,
  `.event-panel__section-title` and `.workspace-status` rules removed
- every admin route file — redundant `revalidate = 0` removed, with the rationale recorded once
  on `(protected)/layout.tsx`

**Removed**
- `features/admin/components/EventWorkspaceContent.tsx` — replaced by `EventInspector`

---

## 5. Known trade-offs

- The drawer's `aria-label` is now the static "مساحة الفعالية" rather than including the event
  title. The title is not known at shell-render time, which is exactly what makes the streaming
  win possible; the event title is the first heading inside the panel.
- Splitting a page into independently streamable regions means two regions can want the same list.
  `features/admin/admin-lists.ts` wraps the three admin list loaders in React's `cache`, so the hub
  body and the calendar overlay share one query per list per request. Anything added under these
  pages should go through those loaders rather than calling a repository directly.
- `Event Inspector.dc.html` is not in the repository, so §3 is derived from the Classical token
  system and the brief's description. Reconcile the visual details if that file lands.

---

## 6. Verification

`pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all four clean.
