# Architecture Decisions

## Decision status

Supabase and Vercel are approved for the event-management scope recorded below. No ORM is used. Phase-three event-detail and registration work is in progress. Registration retention, minor consent, the initial reminder schedule, Resend, Sentry, and the temporary manual WhatsApp boundary are approved. Automated WhatsApp remains deferred pending a business number and official provider decision.

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

## Development migration reconciliation: 2026-08-20

- Status: completed for the linked Supabase development project only. No production migration was applied, repaired, or promoted.
- Evidence: `supabase migration list --linked` reports matching local and remote versions through `20260820092520`.
- Repaired history: the verified existing schema changes for the default venue map URL, administrator message templates, and retained `cancelled` event status were recorded as applied. This repair only reconciled the development migration-history table; it did not execute DDL.
- Deferred drafts: three conflicting, previously untracked SQL drafts now live in `supabase/migration-drafts/` and are explicitly excluded from the deployable migration chain. They cannot be applied without an explicit product decision and a reviewed forward migration.
- Sources: Supabase official documentation was queried through the Supabase MCP for migration repair and deployment workflow; Context7 library ID `/supabase/supabase` was queried for exact-count pagination, ranges, relation selection, and filtering in `supabase-js`.

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
- Request offers: only حجز المساحة and حجز إقامة حفلات receive a price/terms offer. The requester accepts or rejects through the existing long random management token; only its hash is stored. An offer defaults to 48 hours but the administrator can choose a later expiry.
- Request payment: request payment state is an administrator-recorded field separate from offer acceptance (`unpaid`, `deposit_paid`, `paid_in_full`). It is available only after a booking request is accepted and never triggers payment processing.
- Request conflicts: the administrator sees a strong warning for overlap with non-archived club events or other booking requests that are under review or accepted. This is intentionally advisory; no schedule check changes the request state automatically.
- Bayn trips: `events.event_kind` explicitly separates `club_event` from `bayn_trip`. Existing events default to `club_event`; a `bayn_trip` remains an ordinary event and therefore uses the same publication, registration, capacity, waitlist, and reminder workflow. The public `/bayn-trips` route filters only upcoming published `bayn_trip` events.
- Content: editable site settings in the protected dashboard own club copy, contact details, default venue, social links, and literary-partner information. Values are public by design; social controls remain hidden until a real URL is saved.
- Event posters: optional posters use the public `event-posters` Supabase Storage bucket. Only allowlisted administrators can upload or delete PNG, JPEG, or WebP objects; public visitors can only retrieve the selected public object URL.
- Event feedback: the administrator issues a separate 32-byte-token link to an active registration. The database stores only its SHA-256 hash and accepts one approved response. When the participant selects anonymous submission, the registration reference is set to `NULL` in the response record before it is visible to administrators.
- Interested contacts: the public consent form collects the approved name, Saudi mobile, and mandatory email. Consent is unchecked by default and required only to complete the explicit signup. A new 32-byte unsubscribe token is shown after submission and its SHA-256 hash is the only token value persisted. Resubmitting the same normalized email refreshes consent and rotates the old unsubscribe token; no broadcast or automatic delivery is enabled by this feature.
- Event payment: standard event registrations use the approved manual states `unpaid`, `deposit_paid`, and `paid_in_full`. Only an allowlisted administrator can change that value through a narrowly scoped RPC. The payment state remains separate from registration, attendance confirmation, and check-in, and never invokes payment processing.

## Communications and protection: 2026-08-09

- Status: approved; provisioning and implementation remain pending.
- Transactional email: Resend is approved after a custom `bayn` domain is purchased and verified. Email remains optional for guests and is a backup channel.
- Reminder schedule: immediate confirmation, 24 hours before, and 3 hours before are approved.
- WhatsApp: the initial production workflow is an administrator-only manual queue with prefilled messages. Automated WhatsApp is deferred until a business number, official provider, pricing, webhook, consent, and template implications are approved.
- Abuse protection: Server validation, database constraints, idempotency, and rate limiting remain required for anonymous mutation forms.
- Administrator security: one full-access administrator is approved initially, with MFA required before launch.
- Monitoring: Sentry is approved with privacy filtering and no personal form payloads. Lightweight non-advertising traffic analytics are approved.

## Admin experience redesign direction: 2026-08-20

- Status: approved product and UX direction; foundational implementation started on 2026-08-20.
- Overview: the redesigned admin command center is action-first. `يحتاج انتباهك` and the upcoming operational schedule lead; aggregate metrics are secondary.
- Phase-one awareness: use an Attention Queue and Recent Activity. Do not build a notification center or header bell in the first redesign phase.
- Templates: after the provider-neutral manual outbox foundation exists, administrators may edit global default message templates and create explicit per-event overrides with restore-to-default behavior.
- Event duplication: duplication is a P2 capability. It creates a new draft from reusable event content and settings only and never copies registrations, reminders, messages, secure tokens, feedback, or history.
- Interested contacts: the current consent baseline is email-only. Do not use the current consent as authorization for WhatsApp marketing or silently expand its channel scope.
- Event cancellation: use one approved standard cancellation-message template populated with reliable event facts. Do not collect a custom cancellation-reason field.
- Implementation authorization: the product owner subsequently authorized implementation on 2026-08-20. The foundational navigation, action-first Overview, and Event Workspace are implemented without a migration, provider setup, or new external service. Remaining phases retain their documented dependency and approval boundaries.
- Registrations: the operational entry point is `/admin/registrations`. Its URL-backed views distinguish upcoming registrations, waitlist/invitations, and previous/cancelled records; existing legacy routes redirect to the matching view. The first increment filters an authorized in-memory result set at the page boundary; repository-level query filtering and pagination remain pending before data volume warrants them.
- Manual outbox (superseded on 2026-08-20): `/admin/messages` was initially a sequential administrator-only reminder queue. The event-centered decision below replaces this route as the operational entry point while preserving `/admin/messages` as a compatibility redirect.
- Requests: `/admin/requests` now uses a URL-backed master-detail view. Search and status/type filters narrow the authorized list before only the selected booking request fetches its conflict warning; workshop and booking details remain separate, and no event relationship is fabricated.
- Template persistence: `20260820082341_add_message_templates.sql` defines an admin-only RLS-protected global manual-reminder template and optional event-specific override. It has not been applied to the linked development database because unrelated migrations precede it in the pending queue; do not skip or apply them without a separate review.
- Detailed plan: `docs/admin-experience-redesign-plan.md`.

## Event-centered manual messaging: 2026-08-20

- Status: implemented and released to production on 2026-08-21.
- Canonical workspace: `/admin/events/[id]?tab=communications` owns all manual participant communication for one event. `/admin/messages` redirects administrators to event selection instead of maintaining a second operational queue.
- Supported categories: registration confirmation, 24-hour reminder, 3-hour reminder, waitlist invitation, the approved standard cancellation notice, and feedback request. Their availability follows the existing registration and event lifecycle rules.
- Operator contract: one explicit click prepares a fresh secure recipient link and opens a prefilled WhatsApp destination. A separate `تم الإرسال` action records only the administrator's manual confirmation. The product never represents this as provider delivery or read evidence.
- Persistence and privacy: `manual_messages` stores identifiers, category, preparation/sent/superseded timestamps, and only a SHA-256 token hash where a secure link is required. It stores no recipient name, phone, rendered body, or plaintext token. RLS and explicit grants restrict reads and mutations to allowlisted administrators.
- Retry and idempotency: preparing again supersedes any unsent draft for the same registration and category before creating a new link. Marking the same message sent is idempotent. Legacy reminder rows remain visible as read-only history during migration.
- Data scope: registrations, feedback responses, and message history are fetched for the selected event, and server actions revalidate only the event workspace and action-first overview.
- Documentation consulted: Context7 library `/supabase/supabase` for Supabase JavaScript v2 RPC and query behavior, plus current official Supabase database-security guidance for RLS, grants, exposed schemas, and fixed-search-path `security definer` functions.
- Production rollout: source migration `20260820194036_manual_message_workflow.sql` was applied through the Supabase migration API and recorded in the production history as `20260820210954_manual_message_workflow`. Post-apply checks confirmed RLS, the administrator select policy, explicit grants, both public RPC wrappers, the corrected cancellation constraint, unchanged event/registration counts, and no seeded message rows. Vercel deployment `dpl_35asjTbvw2uxsULZLBsubuTMScKe` was promoted afterward.

## Hosted development without Docker: 2026-08-09

- Status: approved and provisioned for development.
- Local application development uses Node.js 24 and pnpm. A full local Supabase stack is not required.
- Database development and SQL/RLS testing use a separate hosted Supabase development environment. Production must never be the destructive test target.
- Provisioning: `bayn-cultural-club-dev` was created in `ap-south-1` on the Supabase Free plan after the provider returned a confirmed recurring cost of `$0/month`. Its public URL and publishable key are configured as Preview-only Vercel overrides; `.env.local`, Vercel Development, and Production remain unchanged.
- Supabase Branching may be evaluated against current plan pricing, but no paid resource is authorized without a cost review.
- macOS repositories should live outside iCloud-synced `Desktop` and `Documents` folders. The current workspace demonstrated `dataless` source and dependency files that caused TypeScript, ESLint, Vitest, and pnpm to appear hung.
- Context7 sources consulted for this stabilization: `/vercel/next.js` for Next.js 16 TypeScript/Node requirements and `/vitest-dev/vitest/v4.1.6` for toolchain compatibility. Official Supabase CLI and Branching documentation confirmed that the full local stack requires a Docker-compatible runtime and that hosted isolated environments are supported.

## Administrator TOTP MFA enforcement: 2026-08-15

- Status: implemented in application code and applied to the separate hosted development project; production rollout remains a coordinated pending step.
- Factor: administrators use Supabase Auth TOTP MFA through a generic authenticator application. No SMS, WhatsApp, paid provider, or new dependency is introduced.
- Login routing: after password authentication and allowlist verification, `getAuthenticatorAssuranceLevel()` routes an `aal1 → aal1` session to enrollment, an `aal1 → aal2` session to challenge verification, and only an `aal2` session to the dashboard.
- Server boundary: every protected page, route, and Server Action continues to call `requireAdmin()`, which now fails closed unless the verified session is `aal2`.
- Database boundary: forward migration `20260815082717_require_admin_mfa_aal2.sql` extends the existing fixed-search-path `private.is_admin()` helper to require the JWT `aal2` claim. This protects the existing RLS policies and privileged RPC checks from direct Data API access with a password-only administrator session.
- Enrollment safety: unverified abandoned TOTP factors are removed before starting a fresh enrollment. Verified factors are never silently removed. The QR secret is displayed only to the signed-in administrator and is never logged or stored by application code.
- Rollout: the application and migration must be released together. The migration must not reach production before the enrollment/challenge routes are available, because it would intentionally remove all administrator data access from `aal1` sessions.
- Verification: application lint, TypeScript, 75 Vitest checks, and the Next.js production build passed. A transactionally isolated development-project check returned `false` for `aal1` and `true` for `aal2`; the security advisor reported only the pre-existing leaked-password-protection warning.
- Documentation: Context7 `/supabase/supabase` and the current official Supabase TOTP MFA documentation were consulted for enrollment, challenge/verify, assurance-level routing, SSR handling, and AAL enforcement through RLS.

## Administrator MFA device management: 2026-08-22

- Status: approved by the owner, implemented on `codex/product-quality-polish`, and deployed to Production on 2026-08-22 in Vercel deployment `dpl_CnKXxrLKFyqC1ufu8eAccVK29Www`.
- Management boundary: only an already authenticated `aal2` administrator can open `/admin/security`, list verified TOTP factors, enroll and verify another factor, or remove an old factor.
- Replacement safety: the application never silently removes a verified factor and prevents removing the final verified factor. The administrator must verify a new device before the old device can be removed.
- Login behavior: when multiple verified factors exist, the MFA challenge screen displays their friendly names and lets the administrator choose which device to use.
- Session handling: after removing a factor, the application refreshes the Supabase Auth session. If the refreshed session is no longer `aal2`, it immediately redirects to challenge one of the remaining factors.
- Recovery boundary: Supabase Auth does not provide TOTP recovery codes. The approved normal recovery method is a second verified factor; losing every factor requires a trusted manual owner recovery through Supabase and never enables an `aal1` bypass in the application.
- Privacy and dependencies: QR secrets remain browser-only transient state and are not logged or persisted by application code. No database migration, new package, paid tier, phone factor, or messaging provider is introduced.
- Production verification: the deployment built with Next.js `16.2.12`, `/admin/security` redirected an unauthenticated request to `/admin/login`, public smoke routes succeeded, and Vercel reported no runtime error clusters or warning/error logs for the new deployment. The live factor-management UI was not mutated during smoke testing because doing so would change the owner's real MFA factors.
- Documentation: Context7 was unavailable in this session, so the current official Supabase changelog, MFA guide, TOTP guide, JavaScript MFA API reference, and the installed `@supabase/auth-js@2.112.0` types were used as the documented fallback.

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

## Administrator check-in recording: 2026-08-09

- Status: implemented and verified on the separate hosted development project; no production migration was applied.
- State model: `check_in_status` (`pending`, `checked_in`, or `absent`) and `checked_in_at` are retained independently from guest `attendance_status`. Only an attended check-in has a timestamp.
- Authorization: `public.record_registration_check_in` is a `security invoker` wrapper. Its non-exposed `private` helper has a fixed empty `search_path`, requires `private.is_admin()`, and is executable by `authenticated` only so the invoker wrapper can reach it. Direct access remains blocked for anonymous callers and the helper enforces authorization itself.
- Application boundary: every UI action reaches `requireAdmin()` before invoking the RPC. The protected registrations table shows guest confirmation and operational check-in as distinct Arabic statuses.
- Verification: a rolled-back transaction verified that a non-admin receives `admin_required`, an approved admin can save `checked_in`, the timestamp is populated, and the independent guest-confirmation field is unchanged. The Supabase security advisor still reports only the existing leaked-password-protection warning, which remains an explicit paid-service decision.
- Documentation sources: Context7 library ID `/supabase/supabase` was queried for RLS, security-definer search paths, and explicit function execution grants. Current Supabase changelog was reviewed; no relevant breaking change affected hosted Postgres functions.

## Administrator password recovery route: 2026-08-09

- Status: implemented for the development Preview; a browser acceptance test awaits the administrator's recovery link.
- Flow: `/admin/reset-password` is deliberately reachable without an existing application cookie so the fragment-based Supabase recovery session is not lost to `proxy.ts`. The client accepts only Supabase's temporary recovery session, calls `updateUser({ password })`, signs out all sessions, and redirects to the normal administrator login screen.
- Privacy: the password remains in the browser-to-Supabase Auth request and is neither handled by a Server Action nor logged by the application.
- Configuration: the administrator login screen sends recovery requests from the browser with an explicit same-origin `/admin/reset-password` redirect. Recovery e-mails initiated from Supabase Dashboard still use the Auth `Site URL`; it must remain set to the Preview `/admin/reset-password` path, with that path allowed in Redirect URLs.
- Documentation sources: Context7 library ID `/supabase/supabase` and current Supabase Auth documentation were consulted for `resetPasswordForEmail`, redirect URLs, recovery sessions, and `updateUser`.

## Service requests foundation: 2026-08-10

- Status: implemented in the separate hosted development project; no production migration was applied.
- Scope: `service_requests` stores only the approved fields for space-booking, celebration-booking, and workshop-application requests. The public form calls a narrowly scoped database function; it does not receive direct table privileges.
- Authorization: personal request data has RLS enabled and is visible only to allowlisted administrators. Secure management tokens are 32 random bytes; only their SHA-256 hashes are stored. The token lookup exposes only the corresponding request and no administrative contact data.
- Lifecycle: requests begin as `new`; an administrator can start review. The schema supports the approved `under_review`, `accepted`, `rejected`, and `cancelled` states plus a request-specific price, terms, and adjustable offer expiry (48 hours by default). User-facing offer authoring and acceptance remain unfinished.
- Retention: the owner approved deletion of request personal data 90 days after `accepted`, `rejected`, or `cancelled`. A daily Supabase Cron job removes expired request rows; application roles cannot execute the cleanup helper.
- Security review: the migration uses fixed empty search paths, non-exposed privileged helpers, explicit grants, and `security invoker` public wrappers. The current Supabase changelog was reviewed; the Data API's explicit-grant change is addressed by the explicit grants and RLS policy.
- Application boundary: submission failures are surfaced as a save failure; the repository does not fall back to direct table insertion, preserving the narrowly scoped RPC boundary.

## Person-specific manual WhatsApp reminders: 2026-08-11

- Status: implemented and verified on the separate hosted development project; no production migration was applied.
- Approved message: the administrator prepares a message using the actual attendee name and event title, with that registration's secure management link. WhatsApp remains manual and no API provider is integrated.
- Token model: the original plaintext booking token cannot be recovered from its SHA-256 hash. Each prepared reminder therefore receives a new independent 32-byte token; only its hash is stored in `registration_reminders`. Existing booking links are not replaced or invalidated by preparing another reminder.
- Validity: reminder tokens resolve only the matching active future booking. They can confirm attendance or cancel that booking through the existing public booking-management flow. A cancellation trigger deletes every reminder token whether cancellation originates from the participant link or the administrator dashboard, and event expiry makes links unusable.
- Delivery truth: preparing or opening a `wa.me` URL does not mark delivery. `sent_at` is populated only through the administrator's explicit «تم الإرسال يدويًا» action; the system does not claim provider delivery.
- Privacy and authorization: reminder rows store no message body, phone, name, or plaintext token. RLS permits metadata reads only to allowlisted administrators. Issuance and sent marking use public `security invoker` wrappers around private fixed-search-path helpers that enforce `private.is_admin()`.
- Documentation sources: Context7 ID `/vercel/next.js/v16.2.9` was queried for Server Actions passed to Client Components and `useActionState`. Current official Supabase RLS, role/grant, and database-function guidance was consulted. No product behavior was sourced from technical documentation.

## Search metadata and controlled indexing: 2026-08-13 (Updated for Production Release: 2026-08-16)

- Status: enabled for production release; Terms and Privacy Policy established as official versions and `robots.ts` configured for public search engine indexing (`allow: /`) with private/admin route exclusions.
- Canonical origin: server-side metadata reads `SITE_URL`, which currently defaults to the approved temporary origin `https://bayn-cultural-club.vercel.app`. A later custom domain requires only an environment change, not a routing rewrite.
- Search indexing: public pages allow full search engine indexing (`User-agent: *`, `Allow: /`), while administrative and token-bearing routes maintain explicit `robots: { index: false, follow: false }` directives and `Disallow` rules in `robots.ts`.
- Public sitemap: `sitemap.xml` contains only approved public routes and upcoming published events returned by the public event catalog. A catalog failure leaves the static public routes available instead of exposing an internal error.
- Private routes: the administrator dashboard, booking-management links, request-management links, waitlist invitations, one-time feedback links, and consent-management links explicitly disable indexing and canonical inheritance. They are also excluded from `sitemap.xml` and disallowed in `robots.ts`.
- Page metadata: public routes use Arabic titles and descriptions; published event pages derive their metadata and optional social image only from the public event record.
- Documentation source: Context7 ID `/vercel/next.js/v16.2.9` was queried for MetadataRoute-based `robots.ts` and `sitemap.ts`, `metadataBase`, relative canonical URLs, and nested metadata inheritance. No product behavior was sourced from technical documentation.

## Public UX and scheduling refinement: 2026-08-15

- Status: approved and in progress on `codex/public-ux-refinement`; Preview review is required before any production promotion.
- Public experience: the home page leads with real upcoming events and presents the approved club copy through accessible Arabic tabs. Public event actions describe the actual registration, waitlist, or closed state in light Saudi Arabic.
- Posters: one shared frame presents the complete original image without cropping or distortion and uses a decorative blurred copy only to fill surrounding space.
- Scheduling: `@daypicker/react@10.0.1` is pinned for the accessible Gregorian RTL calendar. Shared application components keep the existing `YYYY-MM-DD` and `HH:mm` server contract, Riyadh interpretation, and quarter-hour choices. No calendar API or external scheduling service receives data.
- Venue map: the owner approved the exact public Google Maps destination `https://maps.app.goo.gl/Seti5sBZvmhaHeNe8?g_st=ic`. A forward-only nullable `site_settings.default_venue_map_url` column keeps the link administrator-editable. The site opens the external map only after a visitor selects the venue card; no map is embedded and no new tracking provider is initialized.
- Documentation: Context7 IDs `/gpbl/react-day-picker` and `/supabase/supabase` were queried for v10 controlled selection, Arabic locale/RTL, accessible keyboard behavior, stylesheet setup, forward migrations, and environment separation.
## Message-template schema repair: 2026-08-20

- Status: applied to production.
- Cause: the original message-template migration was present in migration history while the Data API initially returned `404` for `public.message_templates`, which made an otherwise valid reminder template appear as a validation failure.
- Repair: forward-only migration `20260820102044_repair_message_templates_schema.sql` idempotently ensures the table, global and per-event uniqueness, update trigger, RLS, explicit authenticated grant, administrator-only policy, and approved global reminder template. The migration was recorded as applied only after the schema was verified.
- Verification: production confirms the table exists, RLS is enabled, the administrator policy exists, and exactly one global `registration_reminder` template is available.
- Documentation: official Supabase changelog and Data API/RLS guidance were checked. The Data API requires both explicit grants and RLS policies.

## Admin dashboard overhaul, phases 0–2: 2026-08-26

- Status: approved and in progress on `codex/product-quality-polish`; see `ADMIN_OVERHAUL_PLAN.md` at the repository root for the full audit, decisions, and roadmap. This entry supersedes the navigation target in `docs/admin-experience-redesign-plan.md` §4–§5 and the calendar route reference dated 2026-08-05 above.
- Navigation (superseded, again): the sidebar is now five items — اليوم / الفعاليات / التسجيلات / الطلبات / الإعدادات. التقويم is folded into `/admin/events` as a `list`/`calendar` view toggle rather than a standalone route; `/admin/calendar` no longer exists. محتوى الموقع، قوالب الرسائل، الأمان، المهتمات، and الاستبيانات are consolidated under `/admin/settings` as tabs (`?tab=`) rather than five separate routes. Registrations keeps its own sidebar entry — the product owner confirmed the 2026-08-20 rationale (cross-event lookup, export, event-day oversight) still holds — and additionally gained a header search box (submits to `/admin/registrations?q=`) and an `event` filter for deep-linking from an event's roster. **Superseded 2026-08-27:** the header search box now submits to `/admin/search` and indexes events and requests alongside registrations — see "Admin UX redesign, phases A–E" below.
- Manual outbox route (fully retired): `/admin/messages` — already a compatibility redirect per the 2026-08-20 entry above — is deleted outright, along with the other legacy compatibility redirects `/admin/registrations/current`, `/admin/registrations/previous`, and `/admin/waitlist`. Nothing in the live application linked to them.
- Data-load failure handling: every admin list repository (events, registrations, service requests, interested contacts, event feedback) now returns a typed `RepositoryResult` instead of silently substituting an empty array or, for site settings, a hardcoded fallback, when the underlying Supabase query fails. Every admin screen renders a distinct error state instead of an empty one on failure. `SiteSettingsRepository.get()` (shared with the public site) is deliberately unconverted — see `ADMIN_OVERHAUL_PLAN.md` §11.1.
- Event workspace: the registrations and waitlist tabs no longer embed the full actionable registration table (which was selectable for the first row only — a real defect, not a design choice). They show a read-only roster with a link into `/admin/registrations` pre-filtered to that event. **Superseded 2026-08-27:** this was the approved fix that had gone unexecuted; it is now done — see "Admin UX redesign, phases A–E" below.
- No migration, provider, or new external service was introduced by this phase of work.

## Admin UX redesign, phases A–E: 2026-08-27

- Status: implemented on `codex/product-quality-polish`. Standing quality gates pass (`pnpm lint`, `pnpm typecheck`, `pnpm test` — 222 tests across 60 files, `pnpm build`). Live browser/visual acceptance testing has **not** been performed this session (no working Chrome automation connection); do the RTL walkthrough on a preview deployment, at both mobile and desktop widths, before merging to `main` — same outstanding gap `ADMIN_OVERHAUL_PLAN.md` §12 already flagged for the phase before this one.
- Source plan: `ADMIN_UX_REDESIGN_PLAN.md` at the repository root. It diagnoses that the admin surface still felt fragmented after `ADMIN_OVERHAUL_PLAN.md` phases 0–4 for two reasons — an approved item from that plan (deleting the duplicated event-workspace registration table) was never executed, and a navigation decision taken after it split one operator job across two screens. See `ADMIN_OVERHAUL_PLAN.md` §13 for how this plan's target design (§6.1) was reconciled.
- **D1 — calendar-first hub:** `/admin` is now `CalendarMonthGrid` plus an attention rail, replacing the prior five-section overview (operating ribbon, attention list, 7-day agenda, recent activity, collapsed metrics). Today's cell is visually anchored; month navigation is a URL param (`?month=YYYY-MM`) shared with `/admin/events`'s calendar view through `features/admin/calendar-month.ts`.
- **D2 — registrations stays, cross-screen jumps into it don't:** `/admin/registrations` remains the dedicated cross-event search/lookup surface, exactly as the product owner reaffirmed on 2026-08-20. What changed is that nothing inside an event's own workspace needs to leave it to reach registrations any more — the roster is fully actionable in place. The `فتح التواصل` link that round-tripped `/admin/registrations` → an event's communications tab and back was deleted from the shared `RegistrationTable` component (it appeared in both places from one component, so removing it fixed both).
- **D3 — event workspace as an overlay panel:** `/admin/events/[id]` is now a `redirect()` to `/admin/events?event=<id>`, which renders `EventPanel` — a native `<dialog>` shown via `showModal()` (true focus trap, native Escape/backdrop dismissal, no hand-rolled trap code), RTL-anchored via `inset-inline-start` (the reading-start edge, which resolves to the *right* edge under `dir="rtl"`), with `@starting-style`/`transition-behavior: allow-discrete` for the open/close slide, and a full-viewport fallback under a 40rem breakpoint. It nests its own `ToastProvider` inside the dialog markup — a plain global toast region would render behind an open native `<dialog>`'s top-layer promotion, since only the dialog's own content is anchored above its backdrop. The six event-workspace tabs collapsed into one scrollable body with fragment-anchor section navigation (`#event-section-*`); `EventForm`/`EventPosterForm` are reachable as an inline edit mode inside the panel's settings section without leaving it, while `/admin/events/[id]/edit` still renders the same components as a standalone page.
- **D4 — calendar clicks open the panel directly:** `buildCalendarItems()` takes a base path (`/admin` or `/admin/events`) so the same calendar-item builder opens `EventPanel` over whichever page hosts it, rather than navigating to a separate route.
- **Global search:** `AdminSearchForm` now submits to `/admin/search`, which queries events and requests (in-memory substring match over `list()`, extracted to the pure, unit-tested `features/admin/admin-search.ts`) and upcoming registrations (the existing database-backed `listPage` search) together.
- **`PageHeader` description lines removed** from every operational admin screen (`اليوم`, `الفعاليات`, `الطلبات`, `الإعدادات`, `التسجيلات`, `فعالية جديدة`, `تعديل الفعالية`) — one title band per screen, per `ADMIN_OVERHAUL_PLAN.md` finding A16's readability direction.
- Bug found and fixed during the RTL static audit for this entry: the panel's closed-state `translate` was `-100% 0`, which — combined with its `inset-inline-start: 0` anchor (physically `right: 0` under RTL) — would have slid the panel across the page toward the left on open/close instead of in and out past the right edge it's anchored to. Corrected to `translate: 100% 0`. Caught by re-deriving the logical-property mapping by hand, not by viewing it rendered; still needs eyes on an actual screen.
- No migration, provider, or new external service was introduced.
