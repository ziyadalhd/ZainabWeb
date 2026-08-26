# Admin Dashboard Overhaul Plan — v2

Audit and refactoring blueprint for the `/admin` section of نادي بَيْن الثقافي.

**Version 2** — revised after the product decisions recorded in §1. Supersedes v1 in full.
The v1 audit evidence is retained; the design, priorities, and roadmap are rewritten, because
one answer (Q11, data volume) invalidated a significant part of v1's reasoning.

**Status:** **All decisions resolved.** The §7 copy list is approved as proposed. The §10 request
lifecycle decision is settled (Option A). Phase 2's dead-code cleanup has been **executed** — see
§10.1. The remaining phases are approved and actionable.

**Scope:** Admin dashboard only.

---

## 1. Decisions recorded

| # | Question | Decision |
| --- | --- | --- |
| Q1 | Waitlist replacement UI — deferred or lost? | **Build it.** Missing interfaces are a core complaint. |
| Q2 | Request offer lifecycle | **Option A adopted.** WhatsApp coordination + simple in-app status tracking. The 48-hour offer machinery is removed. See §10. |
| Q3 | Calendar conflict warnings | **Build.** Build anything that reduces admin effort. |
| Q4 | CSV export semantics | **Filter-by-default, with an explicit "export all".** |
| Q5 | Day-of-event operation | **One person runs the event. A dedicated, ultra-simple mobile experience is wanted.** |
| Q6 | 90-day retention | "Fix and implement properly" — **see the correction in §2; this is already done.** |
| Q7 | Legacy routes / dead code | **Delete anything unused.** |
| Q8 | Caching posture | **Improve speed. Add badges/notifications for new activity.** |
| Q9 | Arabic copy for new UI | **Approved as proposed** (§7), keeping the feminine grammatical tone used across the codebase. |
| Q10 | Concurrent admins | **One.** |
| Q11 | Data volume | **~9 events/month, never more than 15.** |

**Governing principle, from Q1 and Q2:** the dashboard must *remove* cognitive load. Every
change below is measured against that. A change that adds a screen, a tab, or a button must
remove at least as much as it adds.

---

## 2. Correction to the v1 audit

**v1 §8 Q6 claimed 90-day retention was not implemented. That was wrong.** I verified it after
your answer, and it is fully built:

- `registrations.retention_until` is set by trigger to `ends_at + 90 days`
  (`20260805122606_phase_3_registrations.sql:284-305`).
- `private.delete_expired_registration_data()` deletes expired rows and is scheduled via
  **pg_cron** at 00:30 daily (`:310-335`).
- The same pattern exists for `service_requests`, scheduled at 00:45
  (`20260810094942_service_requests.sql:615-639`).

I had grepped the migrations for a retention *policy* and stopped before finding the cron
schedule. No action needed here — the correct follow-up is to **verify the cron jobs are
actually running in the hosted project** (`select * from cron.job`), which is an operational
check, not development work. Added to §8 Phase 4.

This also has a design consequence, below.

---

## 3. The reframe — the system is built for roughly 100× its real workload

This is the most important finding, and it only became visible with Q11.

**Actual steady-state volume:**

| | Figure |
| --- | --- |
| Events | ~9/month, hard ceiling 15 → **~110–180/year** |
| Registrations per event | bounded by `capacity` (typically tens) |
| **Live registration rows** | **capped by the 90-day retention job at roughly one quarter's worth — on the order of 1,000** |
| Concurrent admins | **1** |

The retention job means the registrations table is **self-limiting**. It does not grow without
bound. Only `events` accumulates, at ~180/year.

**What the admin panel was built for:** cross-event search with 25-row pagination, a
master/detail split pane, three filter views, six tabs per event, a separate global
registrations workspace, and a separate per-event registrations workspace.

That is the architecture of a multi-tenant CRM. Applied to a dataset where **a whole month of
events fits on one screen with room to spare**, it produces exactly the symptom described in
Q1: too many buttons, too much screen-switching, too much manual work. The interface is
navigating a filing cabinet that contains one folder.

**This inverts v1's priorities.** v1 recommended a Phase 4 that added `listPage` pagination to
three more entities. That was correct for a large dataset and is **wrong here** — it would add
machinery, and machinery is the disease. v1's performance findings are downgraded accordingly:

| v1 finding | v1 severity | v2 severity | Why |
| --- | --- | --- | --- |
| A5 unbounded reads on 5 screens | 🟠 High | 🟡 **Low** | ~1,000 live rows. Fetching them is fine. Do **not** add pagination. |
| A6 UUID list in PostgREST filter | 🟠 High | 🟠 **Medium** | Still a real defect: ~180 events/year × 37 chars means the URL crosses typical limits in **year 1–2**, and §5 A2 makes it fail *silently*. Fix it as a correctness bug with a scoped query — not with pagination. |

The performance work that actually matters for Q8 ("improve speed") is **not** query
optimisation. At this volume the queries are already fast. It is: fewer full-page navigations,
real loading states, and fewer screens to walk through. Speed here is an **interaction design**
problem, not a database problem.

---

## 4. Audit findings, re-prioritised

Full evidence and reproduction for each is in §5. Severity reflects the v2 reframe.

| ID | Severity | Finding | Fixed in |
| --- | --- | --- | --- |
| A1 | 🔴 Critical | Registration rows inert in event workspace — only the first is actionable | Phase 2 |
| A2 | 🔴 Critical | Query failures render as empty states (21 sites) | Phase 1 |
| A3 | 🔴 Critical | Four sections have no sidebar link at all | Phase 2 |
| A7 | 🔴 Critical | Waitlist invitation flow has no UI *(Q1: build it)* | Phase 3 |
| A4 | 🟠 High | Every action discards search / page / selection | Phase 3 |
| A9 | 🟠 High | Three incompatible feedback mechanisms; stale flash message on reload | Phase 3 |
| A11 | 🟠 High | Destructive actions behind an inaccessible `<details>` pseudo-menu | Phase 3 |
| A6 | 🟠 Med | Unbounded UUID list in PostgREST filter — silent failure in year 1–2 | Phase 4 |
| A10 | 🟠 Med | CSV export ignores filters and is mislabelled *(Q4: fix)* | Phase 4 |
| A12 | 🟠 Med | Inconsistent / absent ID validation across actions | Phase 4 |
| F3 | 🟠 Med | Calendar conflict warnings implemented but never called *(Q3: build)* | Phase 5 |
| A13 | 🟡 Low | `features/` imports from `app/` — inverted dependency | Phase 2 |
| A14 | 🟡 Low | Dead `revalidatePath` calls targeting redirect-only stubs | Phase 2 |
| A15 | 🟡 Low | Client-side `now` gates time-sensitive actions; never updates | Phase 4 |
| A16 | 🟡 Low | 1,000+ character JSX lines | Phase 6 |
| A17 | 🟡 Low | Silent failure, unredacted error logs, empty admin-named public dirs | Phase 1, 2 |
| A5 | 🟡 Low | Unbounded reads — **acceptable at this volume; do not add pagination** | — |

**Security posture is strong and must not regress.** `private.is_admin()` sits in a non-exposed
schema, is `security definer` with `set search_path = ''`, is revoked from `public`/`anon`, and
**requires MFA** (`aal2`) at the row level. RLS is enabled per table with explicit grants, with
no delete grant on `events`. Defence in depth runs middleware → layout → action → RLS. CSV
formula injection is correctly handled. Q10 (single admin) means **no RBAC work is needed** —
the `admin_users` allowlist is sufficient.

---

## 5. Root cause analysis

### 5.1 🔴 A1 — Registration selection is dead inside the event workspace

`features/admin/components/RegistrationTable.tsx:28-29`:

```ts
const selected = registrations.find((r) => r.id === selectedId) ?? registrations[0]!;
return registrationHref
  ? <Link href={registrationHref(registration)} …>{content}</Link>
  : <div className={className}>{content}</div>;   // ← not clickable
```

`registrationHref` is optional. `/admin/registrations` supplies it; the event workspace does not
(`events/[id]/page.tsx:76-77`).

**Failure scenario:** An event has 30 registrations. On `/admin/events/<id>?tab=registrations`
the operator sees 30 names rendered as inert `<div>`s under the caption *"اختاري تسجيلًا لعرض
بياناته وإجراءاته"*, and can only ever act on the **first**. Cancelling or checking in anyone
else is impossible from that screen. Not covered by the current tests.

### 5.2 🔴 A2 — Failures are rendered as empty states

21 sites in the repository layer swallow errors. `lib/supabase/registrations.ts:219-222, 238-240`:

```ts
if (error || eventsError || remindersError || …) {
  console.warn('[Registrations] list returned error or empty data:', …);
  return [];
}
} catch (err) {
  console.warn('[Registrations] list failed gracefully:', err);
  return [];
}
```

**Failure scenario:** An RLS change, expired session, or network fault causes the query to
error. The dashboard renders *"لا توجد تسجيلات هنا"*. The operator cannot distinguish "nobody
registered" from "the database is unreadable" — and makes catering and capacity decisions from
that zero. Substituting zero for unknown is a data-integrity failure, not robustness. It also
conflicts with the project's own instruction not to program defensively.

Compounding: it is what makes A6 dangerous — a failed query looks like a legitimately empty list.

Secondary: the logged objects are raw Supabase payloads, which can embed query predicates and
row values. `AGENTS.md` §9 prohibits logging personal data; this needs a redacting logger
before Sentry is enabled.

### 5.3 🔴 A3 — The navigation does not match the product

`lib/navigation.ts:20-28` — one of seven sidebar entries absorbs five destinations:

```ts
{ href: "/admin/events", label: "الفعاليات والرحلات",
  activePrefixes: ["/admin/events", "/admin/registrations", "/admin/waitlist",
                   "/admin/messages", "/admin/surveys"] },
```

`/admin/registrations`, `/admin/waitlist`, `/admin/surveys`, `/admin/messages` therefore have
**no sidebar link**. Registrations — the most-used screen in an event operations tool — is
reachable only via an overview card or a typed URL. Worse, `activePrefixes` makes
"الفعاليات والرحلات" highlight while you are on those pages, actively teaching the wrong model.

### 5.4 🔴 A7 — Approved workflows with no interface

| Gap | Evidence |
| --- | --- |
| **Waitlist replacement** | `AGENTS.md` §14 requires manual replacement selection with a six-hour invitation. `invite()` is declared (`contracts.ts:69`) and implemented — but **no `inviteAction` exists** and nothing calls it. The UI can only *revoke* an invitation that can never be *created*. `EventCommunicationsWorkspace.tsx:57` displays *"تُرسل الدعوة فقط بعد اختيار بديلة"*, referencing a step with no interface. The overview generates a *"مقعد متاح مع قائمة انتظار"* card (`AdminOverview.tsx:48`) linking to a screen where the task cannot be completed. |
| **Request lifecycle** | `createServiceRequestOfferAction`, `setServiceRequestPaymentStatusAction`, `startServiceRequestReviewAction` exist and are **never imported**. `ServiceRequestOfferForm` and `ServiceRequestPaymentStatusForm` are **never rendered**. See §9. |
| **Conflict warnings** | `getConflicts()` implemented (`service-requests.ts:285`), never called. *(Q3: build.)* |

### 5.5 🟠 A4 — Actions destroy the operator's context

`registrations/actions.ts:22-40` — `successPath` is a **constant** carrying no `q`, no `page`,
no `id`:

```ts
export async function cancelRegistrationAction(id: string) {
  await runRegistrationAction(id, "cancel", "/admin/registrations?view=upcoming");
}
```

**Failure scenario:** The operator searches `"فاطمة"`, pages to result 3, and cancels a
registration. They land on page 1 of the unfiltered list with the detail pane reset to a
stranger. To act on a second person from the same search they must retype the query. Across a
40-person session this is the single biggest source of friction.

### 5.6 🟠 A9 / A11 — Feedback and destructive actions

| Mechanism | Used by | Problem |
| --- | --- | --- |
| Query-string flash | registrations, events, templates | Persists in the URL — reloading **replays a stale success message** |
| `useActionState` | payment, poster, settings | Correct, but inconsistent with the above |
| Silent no-op | `markServiceRequestContactedAction` | `catch { return; }` — failure is invisible |

No toast system. Copy is duplicated as ad-hoc `Record<string,string>` maps per page. Error
feedback is lossy by design: `registrations/page.tsx:81` renders one generic
*"تعذر تنفيذ الإجراء"* regardless of which of four error codes occurred.

Cancelling one registration costs **four interactions**, two behind a disclosure: select row →
open `<details>` "إجراءات إضافية" → "إلغاء التسجيل" → "تأكيد". The disclosure
(`RegistrationTable.tsx:19`) is a raw `<details>`/`<summary>` with no Escape handling, no focus
trap, no click-outside, and a non-absolute panel that **pushes surrounding content**.
`ConfirmActionForm` replaces its trigger in place, causing a **layout shift** that can move the
next row under the cursor mid-click — on an irreversible action.

### 5.7 🟠 A6 — Unbounded UUID list in a PostgREST filter

`lib/supabase/registrations.ts:330`:

```ts
query = query.or(`status.eq.cancelled,event_id.in.(${eventIds.join(",")})`);
```

`eventIds` comes from an unfiltered `events` select. Each UUID adds 37 characters to the request
URL. At ~180 events/year the URL crosses typical PostgREST/proxy limits within **year 1–2**, the
request fails, and A2 renders it as an empty list. The "previous registrations" view would
simply appear empty, with no error.

### 5.8 🟠 A10 / A12 — Export and validation

- **A10:** `export/route.ts:28` calls `repository.list()` and applies only a scope filter, while
  the button reads *"تنزيل القائمة المعروضة"* (download the displayed list). It exports **every**
  registration in scope, ignoring `q` and `page`. For bulk personal data this is a privacy
  problem under `AGENTS.md` §9, not just a copy bug. *(Q4 resolves this.)*
- **A12:** `events/actions.ts` uses a strict RFC-4122 pattern for the poster action but **not**
  for `updateEventAction` or `changeEventStatusAction`. `requests/actions.ts` validates no IDs.
  `messages/templates/actions.ts:29` uses a loose `/^[0-9a-f-]{36}$/i`.
  `startServiceRequestReviewAction` has **no try/catch** at all. RLS is the real boundary, so
  this is not an escalation path — but malformed input surfaces as an unhandled error instead
  of a clean rejection.

### 5.9 🟡 A13–A17 — Structure

- **A13:** `RegistrationTable.tsx:6` imports six server actions from
  `app/(dashboard)/…/actions.ts`. The dependency points `features/ → app/`, inverting the
  intended direction. The correct pattern already exists in the same codebase —
  `EventCapacityTable` takes `statusAction` as a prop — it is just applied inconsistently.
- **A14:** `revalidateRegistrationViews()` revalidates six paths, **four of which are
  redirect-only stubs**. Under `force-dynamic` (declared in the layout *and* repeated in 21
  route files) these calls are inert anyway: a cache-invalidation strategy for a disabled cache.
- **A15:** `EventCommunicationsWorkspace.tsx:85` — `const now = useMemo(() => new Date(), [])`
  in a client component gates whether 24h/3h reminders appear. Server and client compute
  different values, and it **never updates** — the reminder will not appear until a refresh.
- **A16:** `AdminOverview.tsx` is 78 lines containing lines over 1,000 characters;
  `RegistrationTable.tsx:29` is a single ~1,900-character line holding the entire master/detail
  render. This defeats review and `git blame`, and is a real reason the codebase *feels* chaotic.
- **A17:** Three empty leftover directories sit under the **public** route group despite admin
  names: `app/(public)/visual-admin-schedule/`, `visual-admin-operations/`,
  `__visual-admin-schedule/`. Harmless while empty, but a `page.tsx` added there would be
  publicly routable with no `requireAdmin()` guard. *(Q7: delete.)*

---

## 6. Target design

### 6.1 Collapse eleven destinations into four

Today: 7 sidebar entries + 4 hidden = **11 destinations**, plus 6 tabs inside the event
workspace and 3 view tabs inside registrations.

Proposed — **4 sidebar entries**, no hidden destinations:

```
اليوم          /admin              ← what needs doing, right now
الفعاليات      /admin/events       ← list → one event page (everything inline)
الطلبات        /admin/requests     ← inbox
الإعدادات      /admin/settings     ← content + templates + security + contacts
```

**What this removes and why it is safe at this volume:**

| Removed | Replaced by |
| --- | --- |
| `/admin/registrations` as a top-level screen | Registrations live inside their event. Cross-event lookup ("find فاطمة's booking") is served by **one global search field in the header** — better than a screen, at ~1,000 live rows. |
| `/admin/waitlist`, `/admin/registrations/current`, `/admin/registrations/previous`, `/admin/messages` | Deleted (redirect-only stubs). *(Q7)* |
| `/admin/calendar` as its own entry | Becomes a **view toggle** on `/admin/events` — list ⇄ month. Same data, same screen. |
| `/admin/interested`, `/admin/surveys` | Sections under `الإعدادات`; feedback also surfaces inline on its own event. |
| 6 tabs on the event page | **One page.** At a capacity of tens, the roster, waitlist, and communications fit without tabs. |

### 6.2 `اليوم` — the whole product, per Q2

The strongest existing idea is the *"يحتاج معالجة"* attention list; it is genuinely good product
thinking sitting on a poor foundation. It becomes the centre:

- **One ranked list of actions**, each answering *what* and *why now*, each opening a place
  where the task can actually be **completed** — fixing today's dead-end where
  *"مقعد متاح مع قائمة انتظار"* links to a screen with no invite control.
- **Each item resolves inline** wherever possible (invite a replacement, mark a request
  contacted) via a drawer, so the operator never leaves the list. This is the mechanism that
  delivers "logs in → knows what to do → finishes → leaves".
- **Derived on the server** from one bounded query. Given the retention job caps live rows, a
  single scoped query is sufficient — **no SQL view or RPC needed**. Simpler than v1 proposed.
- **Empty state is a success state**, not a blank: "لا شيء يحتاج انتباهك الآن."

### 6.3 `وضع اليوم` — day-of-event mobile mode *(Q5)*

A dedicated route, `/admin/events/[id]/live`, designed for one person holding a phone at the door:

- **Search-as-you-type** over the roster (tens of names — instant, no server round trip).
- **One tap = checked in.** Large touch targets, no confirmation, undo via toast.
- **Running count** — arrived / expected — always visible.
- **Nothing else.** No editing, no publishing, no settings. Optimistic updates (safe: single
  admin, per Q10), queued and retried if the connection drops.

Entered from a single prominent control on the event page that appears only on the event day.

### 6.4 Interaction rules applied everywhere

| Rule | Replaces |
| --- | --- |
| **List → drawer.** Rows are `<a>`; activation opens a focus-trapped `<dialog>`, RTL-anchored, Escape-dismissible. | The permanent master/detail split that forces a selection just to scan |
| **One primary action per row**, context-dependent; everything else in the drawer. | The `<details>` pseudo-menu (A11) — deleted outright |
| **Confirm only what is irreversible** (cancellation, marking absent) — in a real dialog. Payment and attendance toggles do not prompt. | Inline `ConfirmActionForm` and its layout shift |
| **Actions never navigate.** Typed state via `useActionState` + a toast. | Redirect-based flash messages — fixes A4 and stale-reload in one change |
| **Three list states: empty / error / loading.** Never a zero count for a failure. | The single `EmptyState` (A2) |
| **Optimistic updates** on cheap toggles. | Full round trip per toggle |

### 6.5 Activity badges *(Q8)*

Single admin (Q10) makes this simple: store `last_seen_at` per admin, badge the sidebar with
counts of registrations and requests created since. No polling infrastructure, no websockets —
a count computed on navigation is enough at this volume.

### 6.6 Speed *(Q8)*

At ~1,000 live rows the queries are not the bottleneck. The wins, in order:

1. **Fewer screens** (§6.1) — the largest win, because the fastest navigation is the one that
   does not happen.
2. **No navigation on mutate** (§6.4) — removes a full server round trip per action.
3. **`loading.tsx` per admin route** — currently absent everywhere, so tab clicks feel dead.
4. **Client-side tab state** instead of `?tab=` round trips.
5. **Resolve the `force-dynamic` contradiction** — decide the caching posture once, in the
   layout, and delete it from the 21 route files.

---

## 7. Arabic copy for approval *(Q9 — Option A)*

Proposed labels, in the feminine address form the codebase already uses (*ابدئي، راجعي،
اختاري*). **Nothing here is implemented until you approve or amend it.** Existing approved
terms are reused wherever possible.

### Navigation

| Key | Proposed | Note |
| --- | --- | --- |
| Sidebar 1 | `اليوم` | replaces `نظرة عامة` |
| Sidebar 2 | `الفعاليات` | absorbs `التقويم` as a view toggle |
| Sidebar 3 | `الطلبات` | unchanged |
| Sidebar 4 | `الإعدادات` | replaces `الموقع والإعدادات`, absorbs `الأمان`, `المهتمات`, `الاستبيانات` |
| Global search | `ابحثي عن مسجلة أو فعالية أو طلب` | new — header field |
| Events view toggle | `قائمة` ⇄ `تقويم` | new |

### `اليوم` screen

| Key | Proposed |
| --- | --- |
| Title | `اليوم` |
| Attention heading | `يحتاج انتباهك` |
| Empty (success) state | `لا شيء يحتاج انتباهك الآن.` |
| Next event label | `الفعالية القادمة` |
| Badge (new activity) | `جديد` |

### Day-of mode

| Key | Proposed |
| --- | --- |
| Entry control | `بدء وضع اليوم` |
| Screen title | `تسجيل الحضور` |
| Search field | `ابحثي بالاسم` |
| Count | `حضرت {n} من {total}` |
| Row action | `تسجيل الحضور` |
| After tap | `تم تسجيل حضور {name}` + `تراجع` |
| Exit | `إنهاء وضع اليوم` |

### Waitlist replacement *(new — A7)*

| Key | Proposed |
| --- | --- |
| Section | `قائمة الانتظار` |
| Primary action | `اختيار بديلة` |
| Confirmation | `سيتم إرسال دعوة إلى {name}، وتنتهي صلاحيتها خلال ٦ ساعات. هل تريدين المتابعة؟` |
| Invited state | `دعوة مرسلة — تنتهي {time}` |
| Revoke | `سحب الدعوة` |
| Success toast | `تم إرسال الدعوة إلى {name}.` |

### Feedback — one centralised set

| Key | Proposed |
| --- | --- |
| Generic save success | `تم الحفظ.` |
| Load failure | `تعذر تحميل البيانات.` |
| Retry | `إعادة المحاولة` |
| Save failure | `تعذر الحفظ. حاولي مرة أخرى.` |
| Permission failure | `انتهت الجلسة. سجّلي الدخول مرة أخرى.` |
| Undo | `تراجع` |

### Export *(Q4)*

| Key | Proposed |
| --- | --- |
| Default | `تنزيل النتائج المعروضة` |
| Explicit all | `تنزيل الكل` |
| Confirm all | `سينزّل هذا بيانات جميع المسجلات في هذا النطاق، وليس النتائج المعروضة فقط.` |

### Conflict warning *(Q3)*

| Key | Proposed |
| --- | --- |
| Heading | `تعارض في الموعد` |
| Body | `يتعارض هذا الطلب مع {title} في {date}.` |
| Note | `هذا تنبيه فقط، ولن يمنع قبول الطلب.` |

---

## 8. Roadmap

Sequenced so each phase ships independently, reverts cleanly, and leaves the dashboard working.

### Phase 0 — Safety net *(no behaviour change)*

The admin surface has **zero server-action tests** today. Build the net before moving anything.

1. Characterisation tests: `RegistrationTable` in **both** modes — pins A1 before the fix —
   `EventCapacityTable`, and `AdminOverview` attention derivation (8 categories, all untested).
2. Tests for all 15 admin actions with mocked repositories: unauthorized, invalid input,
   repository throws, success.
3. Record the Node 24 toolchain in `README.md` — the shell default was v22.11.0, which silently
   blocks `pnpm`.

### Phase 1 — Stop lying about failure

Fixes **A2**, part of A17. Do this first: it changes what every later phase can observe.

1. Typed repository result `{ ok: true, data } | { ok: false, code }`; remove `return []` on
   error from all 21 sites.
2. Redacting logger — codes and identifiers only, never Supabase payloads or personal data.
   Prerequisite for Sentry.
3. Render empty / error / loading distinctly; add `loading.tsx` per admin route.

**Risk:** Low — additive at the type level; the compiler enumerates every call site.
**Note:** this will surface failures that were previously hidden. They are not new.

### Phase 2 — Collapse the navigation

Fixes **A1**, **A3**, A13, A14, A17. The biggest felt win.

1. Four-entry sidebar (§6.1); correct `activePrefixes`; add the global search field.
2. **Delete** the duplicated registrations table from the event workspace — this fixes A1 by
   removal, not by a second selection implementation. Roster renders inline on one page.
3. Fold `/admin/calendar` into an events view toggle. Fold `interested`, `surveys`, `security`,
   `templates` into `الإعدادات`.
4. **Delete** the four redirect stubs, three empty directories, and the three orphaned
   components (`ContentPlaceholderPage`, `ServiceRequestOfferForm`,
   `ServiceRequestPaymentStatusForm` — pending §9). Prune dead `revalidatePath` calls. *(Q7)*
5. Invert the dependency: `RegistrationTable` takes actions as props, matching
   `EventCapacityTable`.

**Risk:** Medium — user-visible. Ship as one revertible commit; walk through it together before
merging.

### Phase 3 — One interaction model

Fixes **A4**, **A9**, **A11**, **A7**.

1. `useActionState` + toasts everywhere; delete `?success=`/`?error=` handling and the per-page
   copy maps. Centralise copy per §7.
2. List → drawer; delete the `<details>` menu; real confirmation dialog for irreversible actions
   only.
3. `useOptimistic` on payment and attendance toggles (safe per Q10).
4. **Build the waitlist replacement UI** — `inviteAction` calling the existing `invite()`,
   selection control, six-hour expiry surfacing, wired to the existing revoke path.
5. Activity badges (§6.5).

### Phase 4 — Correctness and hygiene

Fixes **A6**, **A10**, **A12**, A15.

1. Fix A6 with a **scoped query**, not pagination — the "previous" view filters by date at the
   registrations level instead of materialising every past event ID into the URL.
2. Export honours the active filter; add explicit "تنزيل الكل" with confirmation. *(Q4)*
3. One shared ID guard applied to every action; add the missing `try/catch` to
   `startServiceRequestReviewAction`; fix the silent `markServiceRequestContactedAction`.
4. Move `now` to the server, pass as a prop.
5. Resolve the `force-dynamic` contradiction once, in the layout.
6. **Operational check:** verify both pg_cron retention jobs are live in the hosted project
   (`select * from cron.job`) — see §2.

### Phase 5 — Day-of mode and conflict warnings

1. `/admin/events/[id]/live` per §6.3. *(Q5 — highest-value new build.)*
2. Wire `getConflicts()` into the request view with the §7 warning copy. *(Q3)*

### Phase 6 — Readability

Fixes **A16**. Deliberately last — reformatting before the refactor would produce enormous diffs
across files about to be rewritten.

1. Reformat dense single-line JSX; add a Prettier `printWidth` so it stays fixed.
2. Split `EventCommunicationsWorkspace` (373 lines) and `MfaManagementPanel` (345 lines).
3. Full RTL pass at mobile and desktop on a preview deployment.
4. Update `docs/architecture-decisions.md` and `ROADMAP.md`.

---

## 9. Testing plan

### Current coverage gap

121 tests pass, but across ~4,000 lines of admin code: **zero server-action tests** (all 15
actions, every authorization check and failure path, untested); **zero tests** for
`AdminOverview`, `InterestedContactsTable`, `SiteSettingsForm`, `EventStatusQuickActions`,
`EventPosterForm`, `RegistrationPaymentStatusForm`, `CalendarMonthGrid`; no repository tests for
pagination, search, or the graceful-failure paths; and `RegistrationTable.test.tsx` (2 tests)
does not exercise the branch containing A1. SQL/RLS tests exist (8 files) but were not runnable
in this session.

### Per phase

| Phase | Tests |
| --- | --- |
| **0** | `RegistrationTable` with and without `registrationHref` (pins A1); `AdminOverview` — one test per attention category incl. tone and target `href`; all 15 actions × {unauthorized, invalid, throws, success} |
| **1** | Repository returns `{ok:false}` and **not** `[]` on error; each list renders the error state, not the empty state; redacting logger emits no personal data given a payload containing a name and phone |
| **2** | Every sidebar entry resolves to a real route; every admin route belongs to exactly one entry; `activePrefixes` never matches another entry's route; global search finds a registration by name, phone, and reference |
| **3** | Action produces a toast and does **not** navigate; filter and selection survive a mutation; dialog traps focus and closes on Escape; optimistic update rolls back on failure. **SQL:** invite sets `invited` + six-hour expiry; expired invitation cannot be accepted; revoke returns the row to `waitlisted`; RLS blocks non-admin and `aal1` admin from the new RPC |
| **4** | **Regression test for A6** — a fixture with 500 events must not produce an oversized request; export honours the active filter and "export all" is explicit; ID guard rejects malformed UUIDs on every action |
| **5** | Day-of mode: search filters the roster; one tap checks in; undo reverts; queued update retries after a simulated connection drop. Conflict warning renders for an overlapping request and does not block acceptance |
| **6** | RTL checks at mobile and desktop; assert no English string renders in any admin route |

### Standing gates

Per `AGENTS.md` §12, before each merge: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
plus `pnpm test:db` for Phases 3 and 4. Visual RTL review on a preview deployment for Phases 2,
3, 5.

**Environment prerequisite:** `pnpm` requires Node ≥ 22.13 and the project pins Node 24. Resolve
the local toolchain first, or every gate silently fails to run.

---

## 10. Request lifecycle — decided (Option A)

**Decision:** WhatsApp coordination for workshop and hosting requests, with simple in-app status
tracking. The 48-hour offer machinery — admin-set price and terms, offer expiry, and the secure
accept/reject flow — is **removed**, not deferred.

**Rationale:** the offer flow required re-entering into a form what the administrator had already
sent over WhatsApp. That is precisely the duplicated manual work and button clutter identified in
Q1 and Q2.

### 10.1 Cleanup executed

Removed — all verified unreachable before deletion (no importer; `tsc --noEmit` clean afterwards):

| Removed | Was |
| --- | --- |
| `createServiceRequestOfferAction` | Never imported |
| `setServiceRequestPaymentStatusAction` | Never imported |
| `startServiceRequestReviewAction` | Never imported; also the unguarded action in v1 finding S3 |
| `features/requests/components/ServiceRequestOfferForm.tsx` | Never rendered |
| `features/requests/components/ServiceRequestPaymentStatusForm.tsx` (+ test) | Never rendered |
| `components/ui/ContentPlaceholderPage.tsx` | Never imported |
| `lib/domain/service-request-offer-input.ts` (+ test) | Only used by the removed action |
| `AdminServiceRequestRepository.startReview / createOffer / setPaymentStatus` | Contract + implementation, now unreachable |

`app/(dashboard)/admin/(protected)/requests/actions.ts` now contains one action:
`markServiceRequestContactedAction`.

**Retained deliberately:**

- `getConflicts()` — Q3 approved building conflict warnings on top of it (Phase 5).
- `markContacted()` and the `contacted_at` column — the basis of the new status tracking.
- `respondToOfferByToken()` and the public offer block — **see 10.3, needs one confirmation.**

**Validation after cleanup:** `eslint` ✅ clean · `tsc --noEmit` ✅ clean · `vitest run` ✅
**42 files, 118 tests passed** (down from 44/121 — exactly the three tests inside the two deleted
test files).

### 10.2 Status model to build (Phase 3)

Replacing the five-state model (`new`, `under_review`, `accepted`, `rejected`, `cancelled`) with
the approved lightweight set:

| State | Arabic | Set by |
| --- | --- | --- |
| Pending | `جديد` | Automatically on submission |
| Contacted | `تم التواصل` | Administrator, one tap (already exists via `markContacted`) |
| Confirmed | `مؤكد` | Administrator |
| Rejected | `مرفوض` | Administrator |
| Completed | `منتهي` | Administrator, or automatically after the requested date passes |

This needs a **forward-only migration** (`AGENTS.md` §17) mapping existing rows: `under_review` →
`تم التواصل`, `accepted` → `مؤكد`. The old enum values must not be edited in place.

### 10.3 One confirmation needed — the public offer block

`app/(public)/requests/[token]/page.tsx:42-53` renders an offer section — **"عرض النادي"** with
price, terms, expiry, and accept/reject buttons — gated on `hasActiveOffer`.

Because no offer can now ever be created, that gate is **permanently false** and the block is
dead in practice. It is harmless where it stands (it never renders), but it is dead public-facing
code.

I did **not** delete it: this work is scoped to the admin dashboard, and you described the
public side as solid. Deleting it touches a public route and needs your word.

**Recommendation:** remove it, along with `ServiceRequestOfferResponseAction`,
`respondToOfferByToken`, and the `offerPriceHalalas` / `offerTerms` / `offerExpiresAt` fields on
`ServiceRequestDetails`. Leaving them means the public page carries a branch that can never
execute, which is the same clutter being removed on the admin side.

**Database note:** the offer columns and RPCs (`create_service_request_offer`,
`respond_to_service_request_offer`, `set_service_request_payment_status`) remain in the schema.
Applied migrations must never be edited (`AGENTS.md` §17), so dropping them requires a
forward-only migration. Unused SQL functions are inert and carry no runtime cost — I recommend
bundling this into the Phase 3 status-model migration rather than running one on its own.

### 10.4 Documentation to correct

`AGENTS.md` §16 still specifies admin-defined price and terms, a 48-hour expiry, and manual
payment states. It is now **contradicted by the approved product**. Per `AGENTS.md` §10,
documentation must be updated in the same change that alters business rules — so §16 and the
relevant `docs/` entries need correcting as part of Phase 3. `requests/page.tsx`'s current copy
(*"لا توجد إجراءات أخرى داخل الموقع"*) also needs replacing with the §10.2 status controls.

---

## 11. Progress

| Phase | Status | Delivers |
| --- | --- | --- |
| **0** | ✅ Done | Safety net — 58 new tests: every admin action (auth checks, validation, repository-throw paths), `AdminOverview`'s 8 attention categories, and a test pinning A1's inert-row defect. No behaviour change. |
| **1** | ✅ Done | Failures stop rendering as empty states (A2) — see §11.1. |
| **2** | ✅ Done | Eleven destinations collapse to five; the dead registration selection (A1) is fixed by removal — see §11.2. |
| **3** | ✅ Done (scoped) | One interaction model for registrations (A4, A9, A11); A7 corrected, not built — see §11.3. Request status model (§10.2) and activity badges deferred: both need a migration and hosted-DB access unavailable this session. |
| **4** | Not started | Correctness and hygiene (A6, A10, A12) + verify the pg_cron retention jobs are live. |
| **5** | Not started | Day-of mobile mode (Q5) and conflict warnings (Q3). |
| **6** | Not started | Readability and the full RTL pass. |

### 11.1 Phase 1 — what changed

**New shared modules:**
- `lib/data/result.ts` — `RepositoryResult<T>` (`{ ok: true; data: T } | { ok: false; code: "load_failed" }`) plus `ok()`/`loadFailed()` helpers.
- `lib/observability/logger.ts` — `logRepositoryFailure(scope, error)` logs only the calling scope and the machine error code (e.g. a PostgREST/SQLSTATE code) — never the raw error object, which can embed row values in its message. Satisfies `AGENTS.md` §9 ahead of enabling Sentry.
- `components/ui/LoadErrorNotice.tsx` — the error-state counterpart to `EmptyState`, rendered with `role="alert"`.
- `app/(dashboard)/admin/(protected)/loading.tsx` — one shared skeleton for every protected admin route (Next.js `loading.tsx` cascades to all child segments), closing the "no loading state anywhere" gap noted in §5.3/§6.4.

**Repository methods converted** from swallowing errors into `[]` (or, for `site-settings.get()`, silently falling back to defaults) to returning `RepositoryResult<T>`, with the genuine-empty vs. genuine-failure distinction preserved wherever the original code conflated them (e.g. `registrations.listPage()`'s "no events in this date range" branch stays a success with an empty list):

`lib/supabase/events.ts` (`AdminEventRepository.list`) · `lib/supabase/registrations.ts` (`list`, `listForEvent`, `listPage`, `listManualMessagesForEvent`) · `lib/supabase/service-requests.ts` (`list`, `listPage`, `getConflicts`) · `lib/supabase/interested-contacts.ts` (`list`) · `lib/supabase/event-feedback.ts` (`listSubmitted`, `listSubmittedForEvent`). `lib/data/contracts.ts` updated to match.

**Every call site updated** to branch on `.ok` and render `LoadErrorNotice` on failure instead of an empty table: the overview, calendar, events list, event workspace (registrations/waitlist/communications/feedback tabs — each fetch fails independently so one broken query no longer blanks the whole page), registrations list, requests list, interested-contacts list, surveys list, and the CSV export route (now returns `502` instead of an empty CSV).

**Deliberately out of scope:** `SiteSettingsRepository.get()` still falls back to hardcoded defaults on failure. It is shared by the public site (header, footer, contact, literary-partner pages) and the admin content editor; converting its contract would touch public-rendering code this plan is not scoped to change. The specific admin risk — a failed read could make the content editor appear to load real settings when it actually shows fallback defaults, risking an accidental overwrite on save — is real but narrower than the admin-list problem A2 describes. Flagged for a future, narrowly-scoped fix rather than folded into this pass.

**New regression tests** (the actual guarantee this phase promises): `lib/supabase/events.test.ts`, `lib/supabase/interested-contacts.test.ts`, `lib/supabase/service-requests.test.ts` each assert the repository returns `{ ok: false, code: "load_failed" }` — not `[]` — when the underlying query errors.

**Validation:** `pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm test` ✅ 50 files / 182 tests. `pnpm build` and `pnpm test:db` not run (no hosted Supabase environment available in this session).

### 11.2 Phase 2 — what changed

**A prior approved plan surfaced mid-phase.** While pruning stale references, `docs/admin-experience-redesign-plan.md` — a 1,476-line UX plan approved by the product owner on 2026-08-20, one commit before this branch's work began — turned out to already prescribe an overlapping redesign (Event Workspace tabs, registration consolidation, manual outbox — all already implemented, matching what §5's audit found) and, critically, an explicit decision this plan's draft §6.1 had reversed without knowing it existed: **that document keeps Registrations as its own top-level sidebar item**, for cross-event lookup, export, and event-day oversight. Flagged to the product owner directly rather than resolved unilaterally; the answer was to keep Registrations as a permanent sidebar entry. The five-item nav below reflects that. `docs/admin-experience-redesign-plan.md` now carries a superseding note, and `docs/architecture-decisions.md` records the reconciled decision — both updated in this phase per `AGENTS.md` §10.

**Navigation** (`lib/navigation.ts`) collapsed from seven sidebar entries — one of which (`activePrefixes`) silently absorbed four more routes with no link of their own, the A3 defect — to five real, individually-linked destinations with no `activePrefixes` hack anywhere: اليوم (`/admin`) · الفعاليات (`/admin/events`) · التسجيلات (`/admin/registrations`) · الطلبات (`/admin/requests`) · الإعدادات (`/admin/settings`).

- **`/admin/calendar` folded into `/admin/events`** as a `list`/`calendar` view toggle (`?view=calendar`); the standalone route is deleted. Internal links (`AdminOverview`, the old "فتح التقويم" button) updated to the new URL; the dead `revalidatePath("/admin/calendar")` call removed.
- **`/admin/content`, `/admin/security`, `/admin/interested`, `/admin/surveys`, `/admin/messages/templates` consolidated into `/admin/settings`** as tabs (`?tab=content|templates|security|interested|surveys`). Each tab reuses the existing repository call and form component unchanged; only the routing and the actions' redirect/revalidate targets moved. The old page.tsx files are deleted; `content/actions.ts` and `messages/templates/actions.ts` stay where they are (server actions don't need to be co-located with their page).
- **Four already-dead compatibility redirects deleted outright**: `/admin/registrations/current`, `/admin/registrations/previous`, `/admin/waitlist`, `/admin/messages`. Nothing live linked to them — confirmed by grep before deletion — only stale `revalidatePath` calls (pruned from `registrations/actions.ts` and three public action files) and the removed nav entry referenced them.
- **Three empty leftover directories deleted**: `app/(public)/visual-admin-schedule/`, `visual-admin-operations/`, `__visual-admin-schedule/` — sat under the public route group despite admin-sounding names; a `page.tsx` added there would have been publicly routable with no `requireAdmin()` guard.

**A1 fixed by removal, not repair.** The event workspace's registrations/waitlist tabs no longer embed the full `RegistrationTable` (which was only ever actionable for its first row when no `registrationHref` was supplied — impossible to trigger correctly from that call site). They now render a new read-only `EventRegistrationRoster` component with a link into `/admin/registrations?event=<id>&view=<view>`, which is genuinely selectable. `RegistrationTable.registrationHref` is now a **required** prop — the broken optional/fallback branch that caused A1 no longer exists as a possibility in the type system, not just in current usage.

**A13 fixed** (`features/` importing from `app/`): `RegistrationTable` now takes an `actions` prop bundle instead of importing the six registration server actions directly, matching the pattern already used by `EventCapacityTable`'s `statusAction`. Its sole remaining caller, `/admin/registrations`, passes the real actions in.

**Registrations gained an `event` filter** (`AdminRegistrationListFilter.eventId`, applied as an additional `.eq("event_id", …)` constraint in `listPage()`) to support the roster's deep link, plus a "تُعرض تسجيلات فعالية واحدة فقط" banner with a clear-filter link. The view-tab links and search form now preserve the active query string when switching tabs — previously switching from "القادمة" to "السابقة" while searching silently dropped the search term.

**Global search**: a small `AdminSearchForm` component (`components/navigation/AdminSearchForm.tsx`) — one `q` field, GET-submits to `/admin/registrations` — added to the sidebar (desktop) and header (mobile). It's additive to, not a replacement for, the Registrations nav entry per §11.2's reconciliation.

**New regression tests**: `lib/navigation.test.ts` (no duplicate hrefs, no `activePrefixes` collision, Registrations stays reachable), `AdminSearchForm.test.tsx`, `EventRegistrationRoster.test.tsx`, and a rewritten `RegistrationTable.test.tsx` — the old test that *characterised* the A1 defect now asserts every row is selectable instead.

**Validation:** `pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm test` ✅ 53 files / 189 tests. `pnpm build` could not be run in this environment — the installed `@next/swc` binary is `darwin-x64` but the available Node 24 toolchain resolved to `arm64`; this is a pre-existing local toolchain mismatch, not a change introduced here. `pnpm test:db` not run (no hosted Supabase environment available in this session).

### 11.3 Phase 3 — what changed

**Correction: A7 was already implemented.** The v1 audit claimed "no `inviteAction` exists and nothing calls it" — that was wrong. `SupabaseRegistrationRepository.prepareManualMessage(id, "waitlist_invitation")` (`lib/supabase/registrations.ts:391-394`) already calls `this.invite(id)` internally before preparing the WhatsApp message, and `EventCommunicationsWorkspace` already exposes "دعوة قائمة الانتظار" as a selectable message category for waitlisted registrants — selecting a waitlisted person there and opening the message already flips them to `invited` with a six-hour token, exactly as `AGENTS.md` §14 requires. The v1 audit found this only by grepping for a literal `inviteAction` export and stopped without tracing `prepareManualMessage`. **No new invite action or dialog was built** — that would have duplicated a working capability and given the admin two inconsistent ways to do the same thing.

What genuinely was missing was *discoverability*: nothing pointed a waitlisted registrant's row at the one place the invite lives, and the overview's "مقعد متاح مع قائمة انتظار" card linked to `/admin/registrations?view=waitlist`, a screen with no invite control at all (confirmed — `RegistrationTable`'s waitlist actions are limited to revoke). Fixed both: `EventRegistrationRoster` now shows a "دعوة للحضور" button on any `waitlisted` (not yet invited) row, linking straight to `/admin/events/{id}?tab=communications`; the overview card's `href` was changed to the same destination.

**One interaction model, scoped to Registrations** (the highest-traffic surface and the one A4's "actions discard search/page/selection" bites hardest, since `/admin/registrations` is the only admin screen with real filter/search/pagination state to lose):

- New `components/ui/ToastProvider.tsx` (context + `useToast()`, mounted once in the protected layout) and `components/ui/ConfirmDialog.tsx` / `components/ui/ActionButton.tsx` — both `useActionState`-driven, both push a toast and never navigate.
- `ConfirmDialog` replaces the two problems in finding A11 outright: the inaccessible `<details>`/`<summary>` "إجراءات إضافية" pseudo-menu (no focus trap, no Escape, pushed surrounding content when opened) and `ConfirmActionForm`'s in-place trigger-replacement (the layout shift that could move the next row under the cursor mid-click). It's a native `<dialog>` — real focus trap and Escape handling for free, no hand-rolled a11y logic.
- `registrations/actions.ts`: `cancelRegistrationAction`, `revokeInvitationAction`, `confirmAttendanceAction`, `recordCheckInAction` no longer call `redirect()`; they return a typed `ActionResult` (`lib/data/action-result.ts`). `cancelWaitlistedRegistrationAction` is deleted — it existed only because the old redirect target differed by view; with no redirect, one `cancelRegistration` action serves both. `RegistrationTable` became a client component (`useRouter().refresh()` re-fetches the current route's data after a successful mutation, preserving the URL's search/page/event-filter state — the actual fix for A4) and every secondary action is now flatly visible rather than hidden behind the removed menu (A11 again — nothing operationally routine stays hidden).
- `registrations/page.tsx` and `EventCapacityTable`'s callers still redirect on event-status changes and creation, which are lower-severity: `/admin/events` carries no comparable filter state to lose. Not converted in this pass — flagged as a smaller follow-up rather than expanded into a third surface here.

**New tests**: `ConfirmDialog.test.tsx`, `ActionButton.test.tsx` (open/confirm/toast round-trip for both), rewritten `registrations/actions.test.ts` and `RegistrationTable.test.tsx` for the new signatures, extended `EventRegistrationRoster.test.tsx` for the invite shortcut. jsdom 26 doesn't implement `<dialog>.showModal()`/`.close()` — added a minimal open-attribute polyfill to `vitest.setup.ts` (a known, common jsdom gap; real browsers are unaffected).

**Deliberately deferred, both need a migration + hosted Supabase access this session doesn't have:**
- **Request status model (§10.2)** — collapsing `new/under_review/accepted/rejected/cancelled` to the approved lightweight `Pending/Contacted/Confirmed/Rejected/Completed` set requires a forward-only migration mapping existing rows, which `AGENTS.md` §17 requires be created via the Supabase CLI and reviewed before applying. Writing the UI against unreleased schema values would break every request read/write against the current live database. Not started.
- **`useOptimistic` for the payment-status select** — considered and skipped: it's a select-then-explicit-save form, not a single-tap toggle, so optimistic UI wouldn't reduce perceived latency (the admin already waits at the "save" click either way); the existing pending-state/inline-result pattern is adequate. The two genuine instant-feedback wins (confirm attendance, mark present) already get non-blocking toast feedback via `ActionButton`.
- **Activity badges (§6.5)** — needs `last_seen_at` persistence (a schema change), same constraint as above.

**Validation:** `pnpm lint` ✅ · `pnpm typecheck` ✅ · `pnpm test` ✅ 55 files / 195 tests. `pnpm build` / `pnpm test:db` not run, same environment constraints as Phases 1–2.
