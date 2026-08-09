# Architecture Decisions

## Decision status

Supabase and Vercel are approved for the event-management scope recorded below. No ORM is used. Phase-three event-detail and registration work is in progress. Registration retention, minor consent, the initial reminder schedule, Resend, Cloudflare Turnstile, Sentry, and the temporary manual WhatsApp boundary are approved. Automated WhatsApp remains deferred pending a business number and official provider decision.

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
- Superseded on 2026-08-09: the production model will derive capacity fullness from active reservations and use a separate administrator-controlled registration-open/closed flag. The phase-two column remains transitional until a forward migration replaces its behavior.
- Time: `datetime-local` input is interpreted in `Asia/Riyadh` and stored as `timestamptz`.
- Deferred data: registrations, waitlists, interested contacts, messages, reminders, and survey responses are not stored in this phase. Their admin routes show non-enabled states instead of fixtures.
- Local database runtime: a Docker-compatible local Supabase stack is intentionally not required for this phase. Migration pgTAP coverage runs against the linked hosted database inside a transaction that is rolled back, and database types are generated from the hosted project after CLI authentication. No container runtime is installed solely for this repository.
- Production data: no demonstration events were seeded or copied. The linked database starts with an empty `events` table.
- Documentation sources: current official Supabase SSR, RLS, and Vercel Marketplace guidance plus installed Next.js `16.2.12` documentation were used. The previously verified Context7 Next.js library ID is `/vercel/next.js`; no business rule was sourced from documentation.

## Phase-three event details and registration foundation: 2026-08-05

- Status: in progress on `codex/phase-3-bookings`.
- Event details: `ends_at` and `price_halalas` extend `public.events`. Zero halalas means a free event. Both columns are temporarily nullable only so the three existing phase-two records can be completed without destructive data changes.
- Capacity: database and server validation limit each event to 50 seats. Existing remote data was checked before applying the constraint; the highest stored capacity was 15.
- Publication safety: newly created and edited events require an end time and price. A draft with either transitional value missing cannot be published through the application.
- Public routing: `/events/[id]` reads only a published upcoming event through `EventCatalog`; it does not expose draft, archived, or past records.
- Calendar: `/admin/calendar` supports previous, current, and next month navigation while preserving Gregorian Arabic formatting in `Asia/Riyadh`.
- Messaging direction: WhatsApp is the approved channel. The first delivery boundary is a manual administrator action that opens a prefilled message; no automated WhatsApp provider is selected or integrated.
- Payment: event price is displayed, but payment is collected at the venue. No online payment provider is integrated.
- Registration model: guest registrations require one name and one Saudi mobile number; email is optional. For الصغار, the name is the child's and explicit guardian consent is required. One registration represents one seat.
- Capacity and waitlist: `register_for_event` locks the event row and atomically returns `registered` while capacity is available or `waitlisted` otherwise. Cancellation never promotes another person automatically; only an approved administrator can call the promotion function.
- Data protection: `registrations` has RLS enabled. Application roles have no direct insert, update, or delete privileges. `anon` can execute only the narrowly scoped registration RPC and cannot select personal data. Admin mutations are limited to checked RPC functions that verify `private.is_admin()`.
- Retention: registration personal data has a `retention_until` deadline 90 days after the event and is deleted daily by the `delete-expired-event-registration-data` Supabase Cron job. Application roles cannot call the cleanup function.
- Contact workflow: administrator pages provide prefilled `wa.me` links. Opening and sending WhatsApp messages is manual; no WhatsApp API credential, webhook, or automated provider is present.
- Abuse boundary: the public form includes a honeypot and database constraints, duplicate protection, and atomic capacity handling. Provider-level bot protection or per-IP rate limiting is not implemented and remains a pre-launch risk decision because it would introduce another provider or additional personal-data processing.
- Advisor review: `supabase db advisors` was run after the registration migration. The duplicate permissive `events` policies were replaced by separate `anon` and combined `authenticated` policies in `20260805124701_optimize_event_select_policy.sql`. The remaining security-definer warnings are intentional reviewed API boundaries with explicit grants and internal authorization checks. Leaked-password protection remains disabled pending cost approval.
- Database tooling: migration `20260805115221_phase_3_event_details.sql` was applied to the linked hosted database. The CLI completed successfully; its optional migration-catalog cache emitted Docker warnings, but direct Postgres inspection confirmed both columns and all three constraints.
- Documentation sources: Context7 libraries `/vercel/next.js` and `/supabase/supabase` were queried for Server Actions, explicit grants, RLS, security-definer search paths, and cleanup. Current official Supabase Cron and breaking-change documentation was also reviewed. New public tables and functions use explicit grants in preparation for the Data API default change.

## Product operations target: 2026-08-09

- Status: approved for the production launch roadmap; implementation is pending or in progress as tracked in `ROADMAP.md`.
- Product boundary: the application is an event-operations system, not only a marketing site. It must centralize event discovery, guest registration, capacity, waitlists, attendance, requests, reminders, contact consent, and administrator reporting.
- Public identity: visitors do not create accounts. Secure random management links authorize narrowly scoped booking, invitation, request-offer, feedback, and unsubscribe actions. References alone are never authorization credentials.
- State modeling: reservation state, attendance response, check-in result, and payment state are separate domain concerns. The UI may compose them into approved Arabic labels.
- Capacity: active reservations determine fullness. Registration-open/closed remains an explicit operational control. Waitlist replacement is administrator-selected, with a six-hour invitation that requires acceptance.
- Pricing: events are free or paid at the venue. Store money as integer halalas and snapshot the displayed price onto the registration. No online payment provider is approved for launch.
- Minors: collect participant name and age plus guardian name, Saudi mobile, and explicit consent. Do not collect full birth dates.
- Retention: delete registration PII 90 days after the event and preserve anonymous aggregates. Consent-based future-event contacts remain until unsubscribe.
- Requests: venue and celebration submissions are requests followed by administrator-authored offers and secure acceptance, not real-time public availability bookings.
- Content: editable site settings in the protected dashboard will own club copy, contact details, default venue, social links, and literary-partner information.

## Communications and protection: 2026-08-09

- Status: approved; provisioning and implementation remain pending.
- Transactional email: Resend is approved after a custom `bayn` domain is purchased and verified. Email remains optional for guests and is a backup channel.
- Reminder schedule: immediate confirmation, 24 hours before, and 3 hours before are approved.
- WhatsApp: the initial production workflow is an administrator-only manual queue with prefilled messages. Automated WhatsApp is deferred until a business number, official provider, pricing, webhook, consent, and template implications are approved.
- Abuse protection: Cloudflare Turnstile is approved for anonymous mutation forms. Server validation, database constraints, idempotency, and rate limiting remain required.
- Administrator security: one full-access administrator is approved initially, with MFA required before launch.
- Monitoring: Sentry is approved with privacy filtering and no personal form payloads. Lightweight non-advertising traffic analytics are approved.

## Hosted development without Docker: 2026-08-09

- Status: approved and provisioned for development.
- Local application development uses Node.js 24 and pnpm. A full local Supabase stack is not required.
- Database development and SQL/RLS testing use a separate hosted Supabase development environment. Production must never be the destructive test target.
- Provisioning: `bayn-cultural-club-dev` was created in `ap-south-1` on the Supabase Free plan after the provider returned a confirmed recurring cost of `$0/month`. Its public URL and publishable key are configured as Preview-only Vercel overrides; `.env.local`, Vercel Development, and Production remain unchanged.
- Supabase Branching may be evaluated against current plan pricing, but no paid resource is authorized without a cost review.
- macOS repositories should live outside iCloud-synced `Desktop` and `Documents` folders. The current workspace demonstrated `dataless` source and dependency files that caused TypeScript, ESLint, Vitest, and pnpm to appear hung.
- Context7 sources consulted for this stabilization: `/vercel/next.js` for Next.js 16 TypeScript/Node requirements and `/vitest-dev/vitest/v4.1.6` for toolchain compatibility. Official Supabase CLI and Branching documentation confirmed that the full local stack requires a Docker-compatible runtime and that hosted isolated environments are supported.

## Production registration rules implementation: 2026-08-09

- Status: implemented and verified on the separate hosted development project; not applied to the Vercel-linked database.
- Forward-only migrations: `20260809173141_production_registration_rules.sql` replaces the transitional administrator-authored availability column, and `20260809174913_harden_registration_rpcs.sql` hardens the exposed RPC boundary. Previously applied migrations were not edited.
- Capacity: registration-open/closed is an explicit event control, while `available | full | closed` is derived from registered reservations and unexpired invitations. Capacity cannot be lowered below active reservations.
- Minor registrations: ages 6–12 and 13–17 require participant age, guardian name, Saudi mobile, and explicit consent. One guardian mobile may register multiple minors when participant names differ.
- Price integrity: each registration snapshots the displayed integer-halalas price at booking time.
- Secure links: booking and invitation tokens are 32 random bytes encoded as base64url. Only SHA-256 hashes are stored; URLs expose no personal data. Booking tokens are invalidated after cancellation or event expiry.
- Waitlist: an administrator selects a waitlisted entry manually. The resulting invitation expires after six hours, may be revoked early, and becomes registered only after secure acceptance. No automatic replacement exists.
- Authorization: privileged implementations live in the non-exposed `private` schema with fixed search paths and explicit grants. Public RPC wrappers are `security invoker`; anonymous users receive only narrowly scoped execute grants.
- Verification: event pgTAP passed `16/16`; registration pgTAP passed `47/47`; Supabase security advisors returned no findings. The only performance advisor item was an informational unused-index notice expected in a new empty development database.
- Application verification: public registration, derived fullness, waitlisting, attendance confirmation, two-step cancellation, and invitation acceptance were exercised in the browser at desktop and mobile widths. All temporary events, registrations, and the temporary admin identity were deleted afterward.
- Documentation sources: Context7 ID `/vercel/next.js/v16.2.9` was queried for Server Actions, `useActionState`, redirect behavior, and asynchronous dynamic route parameters. Official Supabase changelog, database-function security, RLS, grants, Cron, and advisor documentation were used for the database boundary. No product behavior was sourced from technical documentation.

## Post-move validation: 2026-08-09

- Status: implemented and verified for the current Codex workspace.
- Runtime evidence: the repository now uses the standard pnpm virtual store at `node_modules/.pnpm`; lint, strict TypeScript, `33/33` tests, and the Next.js production build pass with Node `24.14.0` arm64. The final Codex verification used its bundled pnpm `11.16.0`; the repository remains pinned to `pnpm@11.9.0`.
- Rendering purity: request-time clock access is isolated outside `AdminOverview` and passed as a numeric prop, keeping the presentational component deterministic.
- CSS cascade: global anchor and form-control resets live in Tailwind's `base` layer so utility colors such as `text-white` override defaults. Browser verification confirmed the event-detail CTA now renders white text on the approved dark-green background.
- Database boundary: the linked primary resource was not used as the fixture target. Registration corrections and pgTAP ran only on the separate development project, where event tests passed `16/16`, registration tests passed `47/47`, and security advisors returned no findings.
- Documentation sources: Context7 ID `/vercel/next.js/v16.2.9` was used for Server/Client prop boundaries and serializable request data, and `/tailwindlabs/tailwindcss.com` for Tailwind v4 custom base layers. Current official Supabase changelog and testing/linting documentation were reviewed for breaking changes, explicit Data API exposure, pgTAP isolation, and `db lint` behavior.
