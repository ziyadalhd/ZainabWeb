# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Primary source of truth

**Read `AGENTS.md` in full before making changes.** It is the authoritative, detailed contribution guide for this repository (language rules, product scope, security/privacy requirements, database conventions, git conventions, working process, completion-report format). This file only adds commands and architecture context that `AGENTS.md` does not cover; it does not restate or override it.

Also relevant:
- `PLAN.md` — approved product definition (Arabic).
- `ROADMAP.md` — milestone/status tracker.
- `docs/architecture-decisions.md` — approved architecture decisions.
- `docs/open-questions.md` — unresolved decisions; do not silently resolve items listed here.

## Project overview

نادي بَيْن الثقافي — an Arabic RTL event-operations platform: a public site (event discovery, guest registration, surveys, booking requests) plus a protected `/admin` operations dashboard, on Next.js App Router + Supabase, deployed to Vercel.

## Commands

```bash
pnpm install --frozen-lockfile   # install deps (Node 24.x, pnpm 11.9.0 pinned)
pnpm dev                         # start dev server
pnpm lint                        # eslint over app, components, features, lib, proxy.ts, next.config.ts, vitest.config.mts, vitest.setup.ts
pnpm typecheck                   # tsc --noEmit
pnpm test                        # vitest run (single run)
pnpm test:watch                  # vitest watch mode
pnpm build                       # production build (type errors fail the build; do not disable this)
pnpm test:db                     # supabase test db — runs supabase/tests/*.test.sql (pgTAP) against a hosted dev Supabase project, never production
```

Run a single test file: `pnpm vitest run path/to/file.test.ts`. Run a single SQL test: `supabase test db supabase/tests/<name>.test.sql`.

Before committing, run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (per `AGENTS.md` §12/§20).

No Docker and no local Supabase stack are used — database/RLS work targets a separate hosted Supabase development project.

## Architecture

- **Route groups**: `app/(public)/...` is the public site; `app/(dashboard)/admin/...` is the admin dashboard, with `app/(dashboard)/admin/(protected)/...` for authenticated-only admin pages. Route groups are organizational only — they are **not** an authorization boundary (enforced server-side, see below).
- **Auth boundary**: `proxy.ts` (Next.js middleware, matcher `/admin/:path*` and `/verify`) checks Supabase auth claims and redirects unauthenticated requests to `/admin/login`. Server-side authorization is still required in every admin server action/route — the middleware is not sufficient on its own. `lib/auth/require-admin.ts` and `lib/auth/mfa.ts` back MFA and admin-session enforcement.
- **`lib/domain/`**: provider-neutral domain types and input validation/parsing (e.g. `event-input.ts`, `registration-input.ts`, `service-request-input.ts`) — the authoritative server-side validation layer, framework- and provider-agnostic.
- **`lib/supabase/`**: Supabase adapter boundary — query/mutation functions per entity (`events.ts`, `registrations.ts`, `service-requests.ts`, `site-settings.ts`, etc.), plus `database.types.ts` (generated types, must stay confined to this boundary), `server.ts`/`browser.ts` clients, and `config.ts`. Generated `Database` types must not leak into `lib/domain/` or `features/`.
- **`lib/security/`**: secure-token generation/hashing for booking-management links, request links, and waitlist invitations (long random token, only a hash stored, no personal data in the URL — see `AGENTS.md` §14).
- **`lib/messaging/`**, **`lib/export/`**, **`lib/time/`**, **`lib/format/`**: transactional email/manual-WhatsApp-queue support, CSV/report export, `Asia/Riyadh` time formatting from UTC-stored instants, and shared formatting helpers.
- **`lib/demo/`**: demonstration/fixture data, kept out of production code paths — never import it from `features/` or `app/` production logic.
- **`features/<domain>/`** (`admin`, `bookings`, `events`, `home`, `requests`, `scheduling`, `security`, `surveys`): UI components and feature-level logic grouped by domain, each with a `components/` subfolder. Admin and public code stay visibly separated; only genuinely shared components/domain types are shared.
- **`supabase/`**: `migrations/` (forward-only — once applied to a hosted environment, never edit an existing migration; add a corrective one), `migration-drafts/`, `seed.sql`, and `tests/*.test.sql` (pgTAP tests for RLS and SQL behavior, one file per domain area).
- **Testing**: Vitest with `jsdom`, `pool: "forks"`, and `maxWorkers: 1` / `fileParallelism: false` (intentionally serial — see `vitest.config.mts`). Tests are colocated with their subject as `*.test.ts`/`*.test.tsx`.

## Non-negotiable constraints (see `AGENTS.md` for full detail)

- Arabic-only, RTL user-facing text throughout; English for code, identifiers, and docs.
- Do not invent product requirements, form fields, copy, or business rules — check `docs/open-questions.md` and ask before guessing.
- No secrets or `.env.local` in commits; only `NEXT_PUBLIC_`-prefixed env vars are browser-visible, and secret-bearing modules must never be imported into a Client Component.
- Every table in an exposed Supabase schema must have RLS enabled — server-side authorization checks do not replace it.
