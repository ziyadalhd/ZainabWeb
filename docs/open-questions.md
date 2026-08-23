# Open Questions

Last updated: `2026-08-21`

This file contains only unresolved decisions and launch inputs. Approved behavior belongs in `AGENTS.md`, `PLAN.md`, and `docs/architecture-decisions.md`.

## Development environment

- The separate hosted Supabase development project now exists on the Free plan in `ap-south-1`; provisioning was confirmed at `$0/month` on `2026-08-09`. Vercel Preview now uses its public URL and publishable key through Preview-only overrides; Production and Development remain unchanged. When should `.env.local` be persistently switched to the development project? The local browser verification used process-only environment values and did not modify `.env.local`.
- User-provided development administrator accounts have been provisioned and allowlisted without recording their emails or other personal data in this repository. Protected-dashboard acceptance testing is still pending.

## Launch identity and contact

- **Deferred by owner:** a custom `bayn` domain will be selected and purchased after the project grows. Until then, the project may use its Vercel address for development and limited sharing. It blocks Resend domain verification, official sender addresses, and the formal public-launch checklist.
- What are the final public sender addresses after the future domain verification?
- Makkah is confirmed as the city. What are the club's default venue name and full public address?
- `bayn.collective@gmail.com` is approved as the public privacy and customer-contact email. Is a more formal sender address required after the future domain is verified?
- The owner does not approve publishing their personal legal name. Before public launch, confirm whether the distinctive club name plus a suitable public verification record satisfies the applicable disclosure requirement, or whether another registered operating form is required.
- The owner supplied the current freelance-work activity privately, but it does not clearly establish coverage for every service offered through the site. A qualified activity-match review or an appropriately matching activity remains required. Do not record private document details in Git. See `docs/legal-launch-inputs.md`.
- What are the real Instagram and TikTok URLs? Keep the controls hidden or disabled until supplied.
- The current `0537918640` number is personal and temporary. What future WhatsApp Business number will replace it?

## Content approval

- Review and approve the drafted club introduction, name story, objectives, and other public content before launch.
- Supply or approve the literary-partner content.
- What input format and approved choices should the workshop application's `target audience` field use? The current local form offers multiple audience checkboxes, including a youth range that does not match the approved event boundary of 13–17; do not treat those choices as final business rules until approved.
- The approved scope includes public `celebration_booking`, but the current migration `20260820142841_retire_celebration_requests.sql` rejects new requests of that kind and the public route is currently absent. Should the flow be restored with a forward corrective migration, or is the retirement intentional? Do not expose the public form until this conflict is resolved.
- **Approved**: The Privacy Policy and Terms of Service have been established as official text and draft warning notices were removed on `2026-08-16`. Formal legal consultation remains recommended for future business entity expansions.

## Paid service decisions

The providers are approved, but no paid tier is automatically authorized. Before provisioning or upgrading, present current pricing and expected usage for:

- **Deferred by owner for the current low-traffic period:** Sentry setup and custom enforced rate limiting. Vercel Runtime Logs, Supabase Auth limits, and automatic Vercel DDoS protection remain the temporary baseline.

- Vercel plan and production region.
- Supabase production and development environments, including backups and Branching if used.
- Resend email volume and domain requirements.
- Sentry retention and event volume.
- Traffic analytics if the chosen Vercel feature requires a paid plan.
- Supabase leaked-password protection if it requires a plan change.

## Automated WhatsApp — deferred

- Which official WhatsApp Business API provider will be used?
- What are its per-message, template, phone-number, webhook, and data-retention implications?
- Which approved templates cover confirmation, reminders, waitlist invitations, changes, and cancellations?

Until these questions are answered, the approved launch behavior is a structured administrator-only manual WhatsApp queue with automatic email when an optional email is provided.

## Future capabilities — deferred

- Online payment provider and the legal/accounting requirements for accepting funds under the owner's business setup.
- Public user accounts.
- QR or ticket generation.
- External CRM.
- Automatic waitlist replacement.

These items are not required for the first production launch.
