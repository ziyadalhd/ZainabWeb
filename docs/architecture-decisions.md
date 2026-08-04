# Architecture Decisions

## Decision status

Supabase and Vercel are approved for the phase-two events-management scope recorded below. No ORM is used. Messaging, WhatsApp/SMS/email, public accounts, registrations, surveys persistence, and other external providers remain unapproved and excluded.

## Approved technology constraints

The following project-level constraints are approved:

- Next.js.
- App Router.
- TypeScript with strict mode.
- Tailwind CSS.
- Arabic RTL layouts for the entire public website and admin dashboard.
- Server Components by default, with Client Components only when needed.
- `pnpm` for a new project.
- Supabase Postgres and Supabase Auth for phase-two event administration.
- Vercel hosting and Vercel Marketplace resource linkage for the current phase.

These constraints do not approve a particular provider, application architecture beyond what is necessary, or any external integration.

## Provider-neutral foundation

When unresolved provider choices do not block safe work, implementation may define small provider-neutral contracts and keep provider-specific code behind adapters. Such contracts must not encode unapproved business rules or imply that a mock, fixture, or demonstration adapter is production-ready.

## Future decisions

Record approved architectural decisions here only after explicit user approval. Each future record should include:

- Status and approval date.
- Decision and scope.
- Rationale.
- Alternatives considered, when relevant.
- Security, privacy, and migration implications.
- Related questions resolved in `docs/open-questions.md`.

## Documentation check: 2026-08-02

- Context7 library ID: `/vercel/next.js`.
- Source selection: the official Next.js source was selected for its exact name match, high source reputation, strongest documentation coverage among the matching results, and highest benchmark score among the current Next.js documentation candidates returned.
- Topics queried: current project scaffolding and `create-next-app` options; App Router architecture and framework conventions; quality, validation, and version compatibility.
- Outcome: persistent development guidance was updated to reflect current version-aware Next.js practices. This task did not scaffold or modify an application.
- Provider status: no database, ORM, authentication, messaging, WhatsApp/SMS/email channel, hosting, or other external provider was selected.
- Product status: no product requirement or business rule was added or changed.

## Phase-one frontend foundation: 2026-08-02

- Status: approved and implemented as an initial frontend foundation.
- Framework baseline: Next.js `16.2.12`, React `19.2.4`, App Router, strict TypeScript, Tailwind CSS `4.3.3`, ESLint flat configuration, and `pnpm@11.9.0`.
- Routing: public pages use the `(public)` route group, while the demonstration dashboard uses `(dashboard)/admin` and is marked `noindex`.
- Rendering: Server Components are the default. Client Components are limited to mobile navigation and the framework-required error boundaries.
- Direction and language: the root document uses `lang="ar"` and `dir="rtl"`. All user-facing interface states are Arabic.
- Calendar presentation: the phase-one demonstration calendar is Gregorian, formatted with `ar-SA-u-ca-gregory`, and displayed in the `Asia/Riyadh` time zone. This is presentation behavior for demonstration data, not a final scheduling business rule.
- Data boundary: `EventCatalog` and `AdminDashboardSource` are read-only provider-neutral contracts. Their phase-one implementations return explicitly synthetic demonstration records from `lib/demo/`.
- Forms: no form submits, persists, or transmits data. Event feedback exposes only تقييم الضيافة, تقييم المادة, and المقترحات; the other form routes show field-pending states.
- Administration: there is no authentication or authorization in this phase. The dashboard contains no real data, exposes no mutation endpoint, is not linked from public navigation, and must not be treated as production-ready.
- Logo assets: both supplied CMYK JPEG variants are approved for phase one and remain byte-for-byte unchanged. Surrounding accessible text continues to use نادي بَيْن الثقافي.
- Visual system: `#335828` and `#FEFDF1` are provisional interface tokens sampled from the supplied artwork. They do not constitute final visual-identity approval.
- Testing documentation: Context7 library IDs `/vercel/next.js` and `/vitest-dev/vitest/v4.1.6` were consulted for App Router verification and Vitest configuration. Vitest does not directly test asynchronous Server Components, so those routes are covered by type checking, production builds, and browser review.
- Compatibility adjustment: the local Node.js runtime is `22.11.0`. The test toolchain uses Vitest `3.2.4`, Vite `6.4.3`, and jsdom `26.1.0`, whose published engine ranges support this runtime. No framework or runtime upgrade was performed.
- Provider status: no database, ORM, authentication, messaging, WhatsApp/SMS/email channel, hosting, analytics, or other external provider was selected.

## Phase-two event administration: 2026-08-03

- Status: approved and implemented on `agent/phase-2-events`; production deployment remains manual.
- Persistence: Supabase Postgres is the approved database for event records. The application uses `@supabase/supabase-js@2.112.0` and `@supabase/ssr@0.12.4` directly; no ORM was introduced.
- Provisioning: the free Supabase Marketplace resource `bayn-cultural-club` is linked to the existing Vercel project in the Mumbai region (`bom1`, corresponding to the requested `ap-south-1`).
- Public credentials: application code reads only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Secret, service-role, JWT, and Postgres credentials are never imported by application modules.
- Reproducibility: database DDL and RLS live in `supabase/migrations/`. `.env.example` contains placeholders only, while `.env.local` and `.vercel/` remain ignored.
- Authorization: one or more manually provisioned Supabase Auth users may be allowlisted in `public.admin_users`. There is no public signup, password reset, or public-user account interface.
- Defense in depth: `proxy.ts` refreshes auth cookies and performs an optimistic redirect using `getClaims()`. `requireAdmin()` verifies claims and the allowlist inside every protected page and every event mutation. RLS remains the authoritative database boundary.
- Event lifecycle: event creation always produces `draft`; approved transitions are `draft → published`, `draft → archived`, `published → archived`, and `archived → draft`. No hard-delete grant or policy exists.
- Public visibility: `/events` explicitly requests only `published` records whose `starts_at` is in the future, even when the requester also has an admin session.
- Availability: `available | full` is an explicit administrator value and is never inferred from `capacity`.
- Time: `datetime-local` input is interpreted in `Asia/Riyadh` and stored as `timestamptz`.
- Deferred data: registrations, waitlists, interested contacts, messages, reminders, and survey responses are not stored in this phase. Their admin routes show non-enabled states instead of fixtures.
- Local database runtime: a Docker-compatible local Supabase stack is intentionally not required for this phase. Migration pgTAP coverage runs against the linked hosted database inside a transaction that is rolled back, and database types are generated from the hosted project after CLI authentication. No container runtime is installed solely for this repository.
- Production data: no demonstration events were seeded or copied. The linked database starts with an empty `events` table.
- Documentation sources: current official Supabase SSR, RLS, and Vercel Marketplace guidance plus installed Next.js `16.2.12` documentation were used. The previously verified Context7 Next.js library ID is `/vercel/next.js`; no business rule was sourced from documentation.
