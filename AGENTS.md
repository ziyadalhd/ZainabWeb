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
- Contact phone number: `0537918640`.
- TikTok and Instagram links only after the real URLs are supplied.
- Workshop application survey.
- Interested-contact survey.
- Event-feedback survey.

The event-feedback survey currently has exactly these approved fields:

- تقييم الضيافة, scored from 5 to 1.
- تقييم المادة, scored from 5 to 1.
- المقترحات.

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

"Eventually manage" defines product scope, not permission to invent unresolved workflows or integrate unapproved services.

## 5. Explicitly excluded features

Do not add any of the following without explicit user approval:

- Online payments.
- Ticket generation.
- Newsletter functionality.
- Google Maps.
- Guest CRM or Mini-CRM.
- Public user accounts.
- Automatic waitlist replacement.
- Unapproved external integrations.
- Invented promotional content.
- Invented social-media URLs.
- Invented business rules.

Do not add adjacent features merely because they are common in event or cultural-club products.

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
