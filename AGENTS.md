# Repository Instructions for نادي بَيْن الثقافي

These instructions apply to the entire repository. Follow them for every task unless the user gives a more specific instruction that explicitly overrides them.

## 1. Project overview

This repository is for a simplified Arabic website for **نادي بَيْن الثقافي**, a cultural club and event space in Makkah. The product has two primary interfaces:

- A public website for club information, event discovery, applications, registrations, and surveys.
- An internal admin dashboard centered around a calendar for managing events, registrations, attendance workflows, contacts, waitlists, and survey responses.

Treat this document and explicit user instructions as the only approved product sources. Do not expand the product based on conventions, competitor products, or personal judgment.

## 2. Language rules

- Write all user-facing website content in Arabic.
- Use RTL layout throughout the public website and the admin dashboard.
- Write all navigation labels, buttons, forms, validation messages, errors, empty states, and notifications in Arabic.
- Keep the brand name **نادي بَيْن الثقافي** and Arabic section names in Arabic.
- Write code, file names, directory names, TypeScript identifiers, tests, technical comments, and architecture documentation in English.
- Communicate progress reports and final summaries to the user in Arabic.
- Do not translate approved Arabic labels into English in the user interface.

## 3. Strict no-assumption rule

- Do not invent product requirements, form fields, marketing copy, social-media URLs, business rules, age boundaries, providers, schedules, or integration behavior.
- Do not silently decide an unresolved item listed in this file or in `docs/open-questions.md`.
- When a missing decision does not block safe work, create a provider-neutral foundation with explicit boundaries and no implied provider choice.
- When a missing decision affects security, persistence, an external integration, or business behavior, record or update it in `docs/open-questions.md` and ask the user before implementing it.
- Clearly label mocks, fixtures, placeholders, and demonstration-only behavior. Keep them separate from production logic and never describe them as production-ready.
- If requirements conflict or remain ambiguous, stop the affected work, document the question, and request clarification rather than guessing.

## 4. Current product scope

### Public interface

The approved public scope includes:

- Club introduction.
- The idea behind the club name.
- Club objectives.
- حجز المساحة.
- حجز إقامة حفلات.
- رحلات بَيْن.
- الشريك الأدبي.
- Events divided into الكبار, اليافعون, and الصغار.
- Public event details with an optional poster, venue, start and end time, capacity, and free or pay-at-venue pricing.
- Guest event registration without a public account.
- Secure booking-management links for confirmation and cancellation.
- Contact phone number: `0537918640`.
- TikTok and Instagram links only after the real URLs are supplied.
- Workshop application survey.
- Interested-contact survey.
- Event-feedback survey.

The event-feedback survey currently has exactly these approved fields:

- تقييم الضيافة, scored from 5 to 1.
- تقييم المادة, scored from 5 to 1.
- المقترحات.

Each event-feedback link accepts one response. The respondent may choose whether the administrator can see her identity; otherwise the response is presented anonymously.

Do not invent fields for any form or survey. Request the missing fields before implementing forms whose fields have not been approved.

### Admin interface

The admin dashboard is centered around a calendar. Its eventual approved management scope includes:

- Upcoming events.
- Event dates and times.
- Event types.
- Event capacities.
- Registration counts.
- Whether an event is full.
- Interested contacts.
- Previous registrants.
- Current registrants.
- Event-specific registrations.
- Attendance reminders.
- Attendance confirmation.
- Cancellations.
- Event waitlists.
- Manual selection of a replacement after a cancellation.
- Survey responses.
- Venue-booking, celebration-booking, and workshop-application requests.
- Request-specific offers, approval, rejection, cancellation, and manually recorded payment status.
- Site content, contact details, default venue, social links, and literary-partner content.

"Eventually manage" defines product scope, not permission to invent unresolved workflows or integrate unapproved services.

## 5. Explicitly excluded features

Do not add any of the following without explicit user approval:

- Online payments.
- Ticket generation.
- A generic newsletter outside the approved, consent-based upcoming-event contact workflow.
- Google Maps.
- Guest CRM or Mini-CRM.
- Public user accounts.
- Automatic waitlist replacement.
- Unapproved external integrations.
- Invented promotional content.
- Invented social-media URLs.
- Invented business rules.

Do not add adjacent features merely because they are common in event or cultural-club products.

The following providers are explicitly approved for their recorded scope: Supabase for database/auth/storage, Vercel for hosting, Resend for transactional email after domain verification, Cloudflare Turnstile for public-form abuse protection, and Sentry for privacy-filtered error monitoring. Approval of a provider does not authorize a paid plan or unbounded data collection; present cost and privacy implications before enabling a paid tier.

## 6. Technology and coding conventions

- Use the current stable Next.js release that is compatible with the approved architecture. Once the project exists, treat the version installed in `package.json` and the lockfile as authoritative for implementation details.
- Use the App Router. Do not introduce Pages Router conventions into App Router code, including `_app`, `_document`, `getServerSideProps`, `getStaticProps`, `next/head`, or `next/router`.
- Use TypeScript with strict mode enabled. Do not weaken strictness to bypass errors.
- Use Tailwind CSS with the installation and CSS setup documented for the installed Tailwind and Next.js versions; do not copy configuration from a different major version.
- Use `pnpm` when initializing or working with a new project.
- When scaffolding is explicitly approved, use `create-next-app` with `pnpm`, TypeScript, Tailwind CSS, and the App Router. Prefer stable defaults, keep React Compiler and other experimental options disabled unless explicitly approved, and record the selected options.
- Treat the `src/` directory as optional and version-dependent. Preserve the existing repository structure; for a new scaffold, use the stable generator default unless the user approves a different layout.
- Use the generator's default `@/*` import alias unless an existing configuration or explicit user instruction specifies another alias.
- Current `create-next-app` releases may prompt to create `AGENTS.md` or create it by default. Preserve this repository's curated `AGENTS.md`; use the supported opt-out when available and never allow generated generic instructions to overwrite it.
- Use the linting setup supported by the installed Next.js version. For current releases, configure the ESLint CLI with flat configuration, `eslint-config-next/core-web-vitals`, and `eslint-config-next/typescript`; do not add or rely on the deprecated `next lint` command.
- Prefer Server Components. Add Client Components only when browser APIs, local interactive state, or client-only behavior requires them, and keep the client boundary narrow.
- Place `"use client"` only at the top of a client entry-point file. Do not mark an entire layout or page as a Client Component merely because one descendant is interactive; isolate the interactive descendant instead.
- Avoid unnecessary dependencies. Before adding any production dependency, explain why it is required and why built-in or existing options are insufficient.
- Never commit secrets, credentials, tokens, or real private data.
- Document required environment variables with safe placeholder values in `.env.example`.
- Keep databases, authentication, messaging, storage, analytics, and other external services behind small provider-neutral interfaces.
- Keep demonstration data and fixtures separate from production logic.
- Use clear, English TypeScript names and favor small, focused modules.
- Avoid dead code, speculative abstractions, and disabled type or lint checks without a documented justification.

## 7. Code organization

- Follow the installed Next.js App Router file conventions under `app/` or `src/app/`, matching the structure selected at scaffolding time. Use `layout.tsx` for shared layouts and `page.tsx` for routable pages.
- Use route groups only to organize routes without changing URL paths. Do not rely on a route-group name as a security or authorization boundary.
- Use `loading.tsx`, `error.tsx`, `not-found.tsx`, and `global-error.tsx` only where their documented App Router behavior is needed. Error boundaries that require `"use client"` are a justified Client Component boundary, and `global-error.tsx` must provide the root HTML structure required by the installed version.
- Use App Router Metadata APIs through static `metadata` exports or `generateMetadata` as appropriate. Do not use `next/head` in App Router code.
- Use `next/font` for framework-managed local or supported web fonts when approved fonts are available; do not add external font-loading packages unnecessarily.
- Import global CSS, including the version-appropriate Tailwind entry point, from the root layout. Use CSS Modules or component-scoped styling for local styles when Tailwind utilities are not suitable.
- Organize code by clear responsibility: user-interface components, domain logic, server-side use cases, validation, and infrastructure adapters should not be entangled.
- Keep provider-neutral contracts separate from provider-specific adapters.
- Keep administrative code and public code visibly separated while sharing only genuinely common components and domain types.
- Keep validation schemas reusable by server actions or route handlers, while treating server-side validation as authoritative.
- Keep demonstration data in clearly named fixture, mock, or demo modules and prevent accidental use in production paths.
- Co-locate tests with their subject or use a consistent dedicated test structure; do not mix unrelated test conventions.
- Do not reorganize unrelated code or overwrite existing user changes while completing a scoped task.

## 8. Arabic RTL user-experience requirements

- Set the document language to Arabic and direction to RTL, including appropriate `lang="ar"` and `dir="rtl"` behavior at the root layout.
- Ensure the public website and admin dashboard remain usable and visually coherent in RTL at supported screen sizes.
- Use CSS logical properties and RTL-aware layout utilities where possible; avoid hard-coded left/right assumptions.
- Keep Arabic text readable with suitable type, line height, spacing, wrapping, and numeral treatment.
- Check icon direction, breadcrumb order, calendar navigation, form alignment, tables, dialogs, menus, toasts, and focus movement for RTL correctness.
- Do not ship English fallback UI. Loading, validation, error, empty, success, confirmation, and accessibility text must be Arabic.
- Use semantic HTML, labeled controls, keyboard-accessible interaction, visible focus states, and meaningful Arabic alternative or accessible text.
- Do not fabricate Arabic marketing copy. Use approved content or an explicitly marked non-production placeholder when safe and requested.

## 9. Security and privacy requirements

- Validate every submitted value on the server, regardless of client-side validation.
- Treat names, phone numbers, email addresses, attendance information, and survey responses as personal data.
- Collect and expose only data required for an approved feature.
- Do not log personal data, secrets, authentication material, or full form submissions unless an approved, privacy-conscious requirement explicitly calls for it.
- Do not expose administrative data or unprotected administrative mutation endpoints.
- Require an approved authentication and authorization design before implementing protected admin behavior.
- Enforce authorization on the server; hiding admin UI is not an access-control mechanism.
- Keep secrets in environment variables and provide only non-secret names and examples in `.env.example`.
- Treat environment variables as server-only by default. Add the `NEXT_PUBLIC_` prefix only when a value is intentionally safe for disclosure because such values are bundled into browser-visible code.
- Keep secret-bearing modules behind server-only boundaries and never import them into a Client Component. Validate required server configuration at startup or at the server entry point without exposing secret values in errors.
- Apply safe error handling that does not reveal internal details or personal data to users.
- Do not connect a database or external service until its provider and relevant privacy implications are approved.

## 10. Documentation rules

- Write architecture and technical documentation in English.
- Keep `docs/open-questions.md` current. Organize unresolved decisions by category and record decisions only after explicit user approval.
- Keep `docs/architecture-decisions.md` current with approved architectural decisions and their rationale. Do not present a proposal as an approved decision.
- Record assumptions only as questions or explicitly temporary implementation constraints; do not convert them into product facts.
- Update relevant documentation in the same change that alters architecture, external-service boundaries, security behavior, personal-data handling, or business rules.
- Use the exact Arabic brand and section names when documentation refers to user-visible labels.

## Context7 Documentation Policy

- Use Context7 whenever work depends on framework, package, library, or platform documentation.
- Resolve the official Context7 library ID before querying documentation unless an exact, previously verified ID is already available.
- Prefer official documentation with high source reputation, strong name match, broad relevant coverage, and a strong benchmark score.
- Match documentation to the dependency version installed in `package.json`.
- Check the installed version before implementing version-sensitive APIs or configuration.
- Do not copy examples written for another major version without verifying compatibility.
- Do not install or upgrade a dependency only because a newer release exists.
- Prefer the latest stable version compatible with the approved architecture when a new dependency version must be selected.
- Do not use Canary, Beta, Alpha, release-candidate (RC), or other prerelease versions without explicit user approval.
- Do not enable experimental framework or package features without explicit user approval.
- Use focused Context7 queries covering one technical concept at a time.
- Use Context7 as a source of technical documentation only.
- Never use Context7 to invent product requirements, business rules, fields, integrations, or content.
- Never include secrets, credentials, personal data, project-owner information, or proprietary code in documentation queries.
- Record important documentation-backed technical decisions in `docs/architecture-decisions.md`.
- Mention the Context7 library IDs and documentation topics used in implementation reports.
- If Context7 is unavailable, use current official documentation as a fallback and clearly disclose the fallback.
- If neither Context7 nor official documentation is available, do not guess version-specific behavior.

## 11. Working process

1. Read this file, relevant repository documentation, and the existing code before making changes.
2. Inspect the working tree and preserve existing user changes. Do not revert, overwrite, or reformat unrelated work.
3. Identify unresolved decisions touched by the task.
4. Continue with a provider-neutral foundation only when doing so is safe and does not imply business behavior.
5. For security, persistence, external-integration, or business-behavior decisions, update `docs/open-questions.md` and ask the user before implementation.
6. Make the smallest coherent change that satisfies the approved request.
7. Explain every proposed new production dependency before adding it.
8. Check `package.json` and the lockfile before using version-sensitive framework, package, linting, testing, or build behavior, then consult the matching official documentation through Context7.
9. Keep demo behavior visibly isolated and labeled as non-production.
10. Keep optional and experimental generator or framework features disabled unless explicitly approved.
11. Review user-facing text for Arabic and every affected layout for RTL behavior.
12. Run the required validation and report results accurately in Arabic.

## 12. Testing and validation requirements

- Add or update tests for implemented behavior at the appropriate level.
- Test server-side validation, authorization boundaries, error cases, and privacy-sensitive behavior when they are in scope.
- Test RTL-sensitive interactions and Arabic UI states when practical.
- Use testing tools and adapters that explicitly support the installed Next.js and React versions. Verify compatibility in current documentation before adding or changing a testing dependency.
- After implementation, run the repository's ESLint script, an explicit TypeScript check, all applicable tests, and the production build using `pnpm` scripts.
- Keep production-build type checking enabled. Do not set `typescript.ignoreBuildErrors` to bypass errors; fix the errors instead.
- Do not assume the production build performs linting. Run linting as a separate required validation step using the installed version's supported CLI and configuration.
- Do not claim a check passed unless it was actually run successfully. Report skipped or failing checks with the reason.
- When browser tools are available, visually inspect affected Arabic and RTL pages at representative desktop and mobile sizes.
- Verify that no secrets, unapproved provider choices, demonstration-only claims, or unintended personal data appear in the change.

## 13. Completion-report requirements

Provide progress updates and the final completion report in Arabic. The final report must briefly include:

- What changed.
- The paths of created or modified files.
- Validation commands run and their outcomes.
- Any checks that were not run and why.
- Any unresolved decisions, blockers, or questions that require user approval.
- Any demonstration-only or provider-neutral elements, with a clear statement that they are not production-ready where applicable.

Never state that work is production-ready when it depends on unresolved decisions or demonstration behavior.

## 14. Approved event and registration rules

- Audience boundaries are fixed: `children` is ages 6–12, `youth` is 13–17, and `adults` is 18+.
- Club activities are for women. State this inside event details and registration context, not as a tagline attached to the club name.
- One guest registration reserves one seat. Name and Saudi mobile are required; email is optional.
- A guardian may register multiple minors with the same mobile number when participant names differ.
- Minor registration collects the participant name and age, guardian name and Saudi mobile, and explicit guardian consent. Do not collect a full birth date.
- Event pricing is either free or paid at the venue. Store money as integer halalas. The registration retains the displayed price at booking time.
- Capacity is computed from active reservations. `available | full` is no longer an administrator-authored source of truth; use a separate registration-open/closed control.
- Registration closes automatically at event start and may be closed earlier by the administrator.
- Do not lower capacity below existing active reservations.
- Waitlist order follows registration time. Replacement selection is manual, never automatic.
- A selected waitlist entry becomes `invited` for six hours and becomes registered only after accepting the secure invitation. The administrator may revoke the invitation early.
- Store booking state, attendance response, check-in outcome, and payment state as separate concerns even when the Arabic UI presents a combined status label.
- A secure booking-management link is included in confirmation and reminder messages. Use a long random token, store only a hash, expose no personal data in the URL, and invalidate it after the event or terminal cancellation.
- Cancellation requires confirmation, stops reminders, and releases the seat. Rescheduling or venue changes notify registrants and request attendance reconfirmation.
- Event cancellation is a retained status, not a hard delete, and notifies affected registrants.

## 15. Approved messaging, contact, and retention rules

- Email is optional for guests and is an automatic backup channel when supplied. Delivery failure must not cancel a reservation.
- Resend is the approved transactional email provider after a `bayn` domain and sender identities are verified.
- Send immediate confirmation plus reminders 24 hours and 3 hours before the event.
- WhatsApp is the primary long-term channel. Until an official API provider and business number are approved, provide an administrator-only manual queue with prefilled messages and explicit sent marking. Never claim manual messages were delivered.
- Track provider-supported message states and retries with idempotency. Do not include personal data in logs or error-monitoring payloads.
- Upcoming-event contact consent is optional, separate, unchecked by default, and revocable through a secure unsubscribe link. Do not collect interest categories in the initial release.
- Future-event broadcasts require an explicit administrator action and a preview of message content and recipient count.
- Delete registration personal data 90 days after the event and retain only anonymous aggregate statistics. Retain opted-in contact data until unsubscribe.

## 16. Approved request workflows

- `space-booking` and `celebration-booking` are requests, not immediate confirmed reservations.
- Request fields are name, Saudi mobile, optional email, use or occasion type, requested date, start time, end time, attendee count, and notes. Do not collect a budget field.
- Request states are new, under review, accepted, rejected, and cancelled.
- The administrator defines request-specific price and terms. An offer expires after 48 hours by default, with an administrator-adjustable expiry.
- A secure request link allows the requester to view, accept, reject, or cancel without an account.
- Manually recorded request payment states are unpaid, deposit paid, and paid in full. The application does not process payment.
- Calendar conflicts produce a strong warning but do not automatically reject or accept a request. Do not expose the internal venue calendar publicly.
- `bayn-trips` uses the standard event, registration, capacity, waitlist, and reminder workflow.
- Workshop applications collect presenter name, Saudi mobile, optional email, workshop title and description, target audience, duration, expected attendance, requirements, optional experience or portfolio link, and notes.

## 17. Database conventions

- Use PostgreSQL `snake_case` names, UUID primary keys, `timestamptz` for instants, and integer halalas for money.
- Persist instants in UTC and format them for `Asia/Riyadh` at application boundaries.
- Once a migration has been applied to a hosted environment, never edit it. Add a forward-only corrective migration.
- Create migration files through the installed Supabase CLI command, then review the generated SQL before applying it.
- Enable RLS on every table in an exposed schema and use explicit grants. RLS is required even when the application also checks authorization.
- Keep privileged helpers in a non-exposed schema. Revoke default `PUBLIC` execution and grant only the roles that require each function.
- Prefer `security invoker`. A `security definer` function requires a documented reason, fixed `search_path`, explicit grants, internal authorization where applicable, and SQL security tests.
- Do not use production data in tests. Hosted database tests run against a separate development or staging Supabase project and must be transactionally isolated when possible.
- Generated `Database` types belong only in the Supabase adapter boundary; domain types remain provider-neutral.

## 18. Documentation ownership

- This `AGENTS.md` is the primary source of truth for stable product rules, architecture constraints, contribution conventions, and quality requirements.
- `PLAN.md` summarizes the approved product and launch scope in Arabic.
- `ROADMAP.md` is the canonical milestone and status tracker. Update it when task status changes.
- `docs/architecture-decisions.md` records approved decisions and rationale; it is not a status board.
- `docs/open-questions.md` contains only genuinely unresolved decisions and launch inputs.
- `docs/implementation-plan.md` records implementation evidence and validation history. Do not duplicate changing status across all documents when a link to `ROADMAP.md` is sufficient.
- `README.md` owns onboarding, local setup, validation commands, and document navigation.

## 19. Git and commit conventions

- Branch names use the `codex/` prefix unless the user explicitly requests another prefix.
- Use concise Conventional Commit-style subjects: `feat(scope): ...`, `fix(scope): ...`, `docs(scope): ...`, `test(scope): ...`, `refactor(scope): ...`, or `chore(scope): ...`.
- Keep each commit coherent and reversible. Do not mix generated dependency churn, schema changes, feature behavior, and unrelated formatting in one commit.
- Never stage or commit `.env.local`, `.vercel/`, database credentials, personal data, local caches, or generated runtime output.
- Before push, inspect the staged diff and run the checks appropriate to the changed scope. A commit is not evidence that checks passed.
- Use pull requests for feature work. Preview deployments are for verification; production promotion remains explicit until the user approves automation.

## 20. Deployment and release process

1. Develop against a separate hosted Supabase development environment; do not require Docker.
2. Apply and test forward migrations in development before production.
3. Run lint, typecheck, unit/component tests, SQL/RLS tests, and production build.
4. Review affected Arabic RTL flows on mobile and desktop using a preview deployment.
5. Verify secrets, environment targets, monitoring privacy filters, rollback steps, and database backup status.
6. Apply production migrations as a controlled step, then promote the verified Vercel deployment.
7. Perform smoke tests for public events, admin authentication, registration, cancellation, and messaging.
8. Keep Vercel Authentication enabled until the explicit public-launch decision. Do not expose unfinished or placeholder routes.

The pre-launch environment also requires administrator MFA, Cloudflare Turnstile on anonymous mutation forms, privacy-filtered Sentry monitoring, a verified email domain, privacy and terms pages, and a real acceptance test. Online payment and automated WhatsApp remain deferred and are not launch blockers because pay-at-venue and structured manual WhatsApp workflows are the approved release behavior.
