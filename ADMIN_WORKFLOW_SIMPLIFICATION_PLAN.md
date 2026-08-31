# Admin Workflow Simplification Plan

Status: implemented. Scope: the `/admin` operations dashboard only. No public-site behavior changes.

This plan removes the workflow friction in the admin dashboard: a status transition that appears to
hang forever, a roster that only updates on a manual reload, a three-step manual WhatsApp handoff,
and duplicated attendance/payment controls that disagree with one another.

## 0. The single path

Everything below serves one frictionless path. Anything that is not on it is either removed or
demoted to a secondary menu.

```
انشئي فعالية  →  انشريها  →  التسجيلات تصل مباشرة  →  واتساب بضغطة واحدة  →  حضر / مدفوع
Create event  →  Publish   →  Live roster sync     →  1-click WhatsApp     →  Quick check-in
```

## 1. Hanging mutation and infinite loading state

### Root cause

`ActionButton` and `ConfirmActionForm` drive every status transition through `useActionState`. In
React 19 the `isPending` flag it returns stays `true` from dispatch until the surrounding
transition **commits** — not until the server action's promise resolves.

A Next.js Server Action response carries the re-rendered RSC payload of the current route whenever
the action called `revalidatePath`. React applies that payload inside the very same transition, and
a Suspense boundary that suspends during a transition update does not show its fallback — the
transition simply does not commit until every boundary resolves.

`changeEventStatusAction` ends in `revalidateEventViews()`, which revalidates four paths including
the current route. `/admin/events` is `force-dynamic` and holds two suspending server boundaries:

- `EventsBody` — two Supabase list queries;
- `EventPanelBody` → `loadEventWorkspace` — event + registrations + feedback + manual messages +
  templates, mounted whenever `?event=<id>` is in the URL, which is exactly the case when the admin
  publishes from the inspector.

So `pending` stays `true` for the full duration of both refetches, and any one of them stalling
leaves the button reading `جارٍ التنفيذ…` with no way back. Three things compound it:

- `onSuccess` fires `router.refresh()`, a *second* full dynamic re-render of the same page.
- `EventStatusQuickActions` wraps the buttons in a `<details>` that is never closed in code, so the
  menu stays open over a branch that is already stale.
- Nothing in the event-status path is optimistic, so the badge cannot move before the round trip.

### Fix

Replace `EventStatusQuickActions`, `EventPublicationActions`, and `ConfirmActionForm` with a single
`EventStatusControl` client component that follows the pattern already proven in `RegistrationTable`
and `EventCheckInMode`:

- `useOptimistic` holds the publication status, so the badge and the available transitions flip in
  the same frame as the click;
- the menu closes synchronously on click, before the action is dispatched;
- the action runs inside `startTransition` rather than a form-bound `useActionState`, so no button
  label is tied to the revalidation round trip — there is no `جارٍ التنفيذ…` state left to hang;
- toast and `router.refresh()` are issued once, from the always-mounted control, so they survive the
  optimistic re-render that unmounts the button that was clicked;
- a failed action rolls the optimistic status back automatically and toasts the server's reason.

`revalidateEventViews()` drops the redundant `/admin/events/[id]` page revalidation.

## 2. Real-time registration feedback

Chosen mechanism: **lightweight polling**, not Supabase Realtime.

Realtime would need `registrations` added to the `supabase_realtime` publication — pushing rows of
personal data over a socket, and widening the surface that RLS has to hold. `AGENTS.md` §14 keeps
attendee data narrow on purpose. Polling admin-only endpoints that return counts and one name gets
the same result with no schema change and no new exposure.

### One notifier, dashboard-wide

Announcing is a single job owned in a single place. `AdminPulseListener` mounts once in the
protected admin layout, inside the `ToastProvider` and above every admin page, so a registration
announces itself whether the admin is on the hub, the requests queue, or the settings form — and
announces exactly **once**, no matter how many screens are watching.

- `GET /admin/pulse` — admin-guarded, returns
  `{ activeCount, latestRegistrationId, attendeeName, eventId, eventTitle, timestamp }` for the
  newest held seat across every event. One query: an exact count, a `limit(1)`, and the event title
  embedded through `registrations_event_id_fkey`. Nothing else leaves the server — no phone, no
  email, no guardian record.
- `usePoll` is the shared loop behind both pulse hooks: fetch on an interval, pause entirely while
  the tab is hidden, catch up on `visibilitychange`, and swallow a failed poll because the next tick
  retries.
- `useAdminPulse` polls it every 15s and detects an arrival by **the newest registration's id
  changing**, not by the count rising — a registration landing in the same tick as a cancellation
  leaves the count flat and is still an arrival worth announcing.
- On an arrival: the WebAudio chime fires, a toast names the guest and their event
  (`تسجيل جديد: زياد في فعالية مساء بين`) and carries a `فتح الفعالية` link straight to that event's
  inspector, and `router.refresh()` runs once.
- The first response after mount only establishes the baseline; it never announces.

### Live overview refresh

That single `router.refresh()` re-runs whichever `force-dynamic` admin page is currently mounted, so
the hub's attendee totals, expected revenue, seat-fill meters, and day-pulse cards all re-read from
one refreshed server render. No page-specific wiring, and no manual reload.

### The event-scoped band

`RegistrationPulseBanner` in the inspector keeps its own event-scoped poll
(`GET /admin/events/[id]/pulse`) for the seat count and the arrivals tally on the roster the admin is
actually working. It is a **silent counter** — no chime, no toast, no refresh — because the global
listener already owns those, and the badge is what usefully persists after a toast has faded.

### Sound

The chime plays by default and is muted from a control inside the toast itself: offered at the one
moment it is relevant, to an admin who just heard it, and costing no permanent chrome anywhere. The
choice persists in `localStorage`, read at announce time rather than held in React state (nothing
renders from it, and reading storage during render would desync the first client paint from the
server's). Audio is best-effort throughout — a browser that blocks it before a user gesture still
gets the badge and the toast.

## 3. One-click WhatsApp dispatch

The three-step rail — `تجهيز الرابط` → `فتح واتساب` → `تأكيد الإرسال` — collapses to one button.

`sendManualWhatsAppMessageAction` prepares the secure link and marks the message sent in a single
server round trip. The client opens the WhatsApp tab first (inside the click's user-gesture window,
so the popup blocker allows it), then points that tab at the composed URL when the action returns.
Marking happens in the background; the admin never returns to press a second button.

Note on `AGENTS.md` §270, which requires "explicit sent marking" and forbids claiming delivery. The
click *is* the explicit marking — it is still an administrator action, not an automatic send — so the
rule's intent holds while its three-step shape does not. Wording stays honest: the UI says
`سُجّل الإرسال` (send recorded), never "delivered", and re-opening a recorded message stays available
so a handoff that failed inside WhatsApp can be redone.

## 4. Payment and attendance, stripped

`RegistrationPaymentStatusForm` (a `<select>` plus a `حفظ الدفع` submit) and the three overlapping
roster buttons (`تأكيد الحضور`, `تسجيل الحضور`, `تسجيل الغياب`) are replaced by
`RegistrationQuickToggles`:

| Control | Shape | Writes |
| --- | --- | --- |
| `حضر / لم يحضر` | instant switch | `check_in_status` → `checked_in` / `absent` |
| `مدفوع / غير مدفوع` | instant switch | `payment_status` → `paid_in_full` / `unpaid` |
| `إلغاء التسجيل` | secondary menu, confirmed | `status` → `cancelled` |

Both switches are `role="switch"` buttons that apply optimistically and write on toggle — no submit
step, no save button, no confirmation.

`deposit_paid` stays a valid database value (it is still the approved model for service requests, and
forward-only migrations do not drop it). A registration already in that state renders an `عربون`
chip beside the switch, so no recorded state is silently misrepresented as unpaid.

The `attendance_status` `تأكيد الحضور` step is the "unnecessary intermediate status" of the brief: it
duplicated check-in without changing any downstream behavior. It is removed from the admin UI and
`confirmAttendanceAction` is deleted with it. The column and its repository method stay — forward-only.

Waitlist rows keep `تأكيد الدعوة` / `سحب الدعوة`: those are invitation flow, not attendance, and the
brief does not touch them.

## 5. End-to-end simplification

- Inspector tabs go from five to three: `التسجيلات` (roster and waitlist in one panel, waitlist
  shown only when it has entries), `التواصل` (messages plus reminder template), `الإعدادات`
  (settings, publication status, feedback, delete).
- The event card's `<details>` status menu becomes a flat row of at most two transitions plus a
  quiet secondary menu — no disclosure widget to open before acting.
- `المزيد` secondary menus hold only the destructive and rare actions.
- Copy: labels state the outcome (`نشر`, `إلغاء`, `أرشفة`) rather than describing the mechanism.

## 6. Poster framing

Every surface that shows a poster uses one fixed aspect (`aspect-[4/5]`), so an unframed upload gets
whatever `object-fit` decides — a portrait photo letterboxed against a blurred backdrop, a wide
banner with its subject cropped out at the sides. Selecting a file now opens a framing tool instead
of accepting the file as-is.

- `lib/media/crop-geometry.ts` — the maths, free of the DOM: cover scale, display size, offset
  clamping, and the export width. The frame is authoritative and the image is scaled to *cover* it,
  so a source of any shape yields the same undistorted output rectangle; whatever does not fit is
  cropped, never squeezed.
- `lib/media/crop-image.ts` — draws the framed region to a canvas and returns an optimised `File`.
  WebP first, JPEG when the browser cannot encode WebP, and the filename is rewritten to match what
  was actually encoded. Export width is capped at the source pixels visible through the frame, so
  zooming in makes a smaller file rather than an upscaled, softer one.
- `components/ui/ImageCropper.tsx` — the modal: drag to pan, wheel or slider to zoom, quarter-turn
  rotate, reset, and rule-of-thirds guides. Interaction runs on a CSS transform so dragging stays
  smooth on a large image; the canvas runs once, on apply, from the same numbers.
- `features/admin/components/EventPosterField.tsx` — the shared picker used by both `EventForm` and
  `EventPosterForm`. The cropped file is loaded into the existing `name="poster"` input via
  `DataTransfer`, keeping the poster on the ordinary multipart path — same field, same server
  action, same validation — with no server change at all. The original file is retained so
  `إعادة ضبط الإطار` re-frames the full image rather than re-cropping an already-cropped one.

Offsets and the preview use physical `left`/`top` and a physical `translate`, since CSS `transform`
is not direction-aware and mixing logical properties would flip the drag under RTL.

### The object URL's lifetime

The cropper's `<img>` gets its `src` from an effect keyed on the file, not from a URL cached in
state. State outlives an effect's cleanup, and React Strict Mode mounts effects, tears them down,
and mounts them again — so a URL minted once during render and revoked by that teardown left the
image pointing at a dead blob for the rest of the component's life, which is a broken-image
placeholder in every development run. Re-running the effect mints a fresh URL, which is what makes
the teardown safe: the URL is released when the file changes or the cropper closes, never in
between.

`src` is assigned imperatively so it lands after commit, by which point React has attached the
`load` and `error` handlers — the decode can never finish before something is listening. Every
dimension-dependent value is derived in `load` and nowhere else, since `naturalWidth` is 0 until
then. A failed load retries once through `FileReader.readAsDataURL`, and a second failure — or a
decoded-but-empty image — reports it and leaves the cropper cancellable with the confirm button
inert, rather than stuck on a placeholder that never resolves.

## Verification

`pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all four must pass with no warnings
introduced.
