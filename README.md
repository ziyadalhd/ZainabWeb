# نادي بَيْن الثقافي

Arabic RTL event-operations platform for نادي بَيْن الثقافي in Makkah. The product combines a public event and request experience with a protected operations dashboard for events, registrations, attendance, waitlists, venue requests, communications, and reporting.

## Current status

- Phase two event administration is deployed on Vercel and backed by Supabase.
- Phase three registration work exists on `codex/phase-3-bookings`, but is not yet production-ready or fully verified.
- The hosted Supabase schema currently includes event-detail and registration migrations that are ahead of the production application.
- The public Vercel deployment remains protected and is not the final public launch.

See [PLAN.md](./PLAN.md) for the approved product definition and [ROADMAP.md](./ROADMAP.md) for execution status.

## Required runtime

- Node.js 24.x
- pnpm 11.9.0
- No Docker or local Supabase stack is required.

The repository should be stored outside iCloud-synced `Desktop` or `Documents` folders. On macOS, use a location such as:

```text
~/Developer/ZainabWeb
```

iCloud may convert source and dependency files to `dataless` placeholders, which can make TypeScript, ESLint, and Vitest appear to hang.

## Local setup

Install Node.js 24 with a version manager such as `fnm`, then install the pinned package manager:

```bash
fnm install 24
fnm use 24
npm install --global pnpm@11.9.0
pnpm install --frozen-lockfile
```

Copy `.env.example` to `.env.local` and provide the publishable credentials for the hosted Supabase development project. Never use production secrets or a Supabase secret/service-role key in browser-visible configuration.

Start the application:

```bash
pnpm dev
```

Public events are available at `/events`. The protected dashboard is available at `/admin`, and unauthenticated visitors are redirected to `/admin/login`.

## Validation

Run these checks before committing application changes:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Database migrations and RLS tests must run against a separate hosted Supabase development environment. Do not run destructive tests against production. The project intentionally does not require Docker.

## Documentation ownership

- `AGENTS.md`: stable engineering and product contribution rules; the primary contribution source of truth.
- `PLAN.md`: approved product behavior and launch scope.
- `ROADMAP.md`: milestone status and execution order.
- `docs/architecture-decisions.md`: approved architecture decisions and rationale.
- `docs/open-questions.md`: unresolved decisions and launch inputs.
- `docs/implementation-plan.md`: detailed implementation evidence and validation history.
