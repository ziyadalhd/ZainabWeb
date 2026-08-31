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
attendee data narrow on purpose. Polling a single admin-only endpoint that returns counts and one
name gets the same result with no schema change and no new exposure.

- `GET /admin/events/[id]/pulse` — an admin-guarded route handler returning
  `{ activeCount, capacity, latestId, latestName }`. Nothing else leaves the server.
- `useRegistrationPulse` polls it every 15s, pauses while the tab is hidden, and resumes on focus.
- On a rise in `activeCount`: a live badge appears above the roster, a toast names the new
  registrant, a short two-tone WebAudio chime plays, and `router.refresh()` pulls the real rows in.
- The chime plays by default and is muted from the banner itself; it is never played on the first
  poll after mount, which only establishes the baseline. Audio is best-effort — a browser that
  blocks it before a user gesture still gets the badge and the toast.

The roster, the seat counters, and the capacity meter all read from the refreshed server data, so
they stay in one consistent state rather than drifting apart.

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

## Verification

`pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all four must pass with no warnings
introduced.
