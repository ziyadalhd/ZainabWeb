# Open Questions

Last updated: `2026-08-12`

This file contains only unresolved decisions and launch inputs. Approved behavior belongs in `AGENTS.md`, `PLAN.md`, and `docs/architecture-decisions.md`.

## Development environment

- The separate hosted Supabase development project now exists on the Free plan in `ap-south-1`; provisioning was confirmed at `$0/month` on `2026-08-09`. Vercel Preview now uses its public URL and publishable key through Preview-only overrides; Production and Development remain unchanged. When should `.env.local` be persistently switched to the development project? The local browser verification used process-only environment values and did not modify `.env.local`.
- User-provided development administrator accounts have been provisioned and allowlisted without recording their emails or other personal data in this repository. Protected-dashboard acceptance testing is still pending.

## Launch identity and contact

- Which available `bayn` domain will be purchased?
- What are the final public sender addresses after domain verification?
- What is the final administrator email used for Auth, alerts, and account recovery?
- What are the club's default venue name and address?
- What legal entity or responsible-person details and contact channel should appear in the privacy policy and terms?
- The owner confirmed they have a Saudi freelance-work document. Before public launch, what is the exact provider name shown on it, what activity does it cover, and what dedicated business contact channel should receive privacy and customer requests? The document number, national ID, and document image must not be published. See `docs/legal-launch-inputs.md`.
- What are the real Instagram and TikTok URLs? Keep the controls hidden or disabled until supplied.
- The current `0537918640` number is personal and temporary. What future WhatsApp Business number will replace it?

## Content approval

- Review and approve the drafted club introduction, name story, objectives, and other public content before launch.
- Supply or approve the literary-partner content.
- Review and approve the final privacy policy, terms, cancellation language, and guardian-consent wording. Engineering drafts are not legal advice.

## Paid service decisions

The providers are approved, but no paid tier is automatically authorized. Before provisioning or upgrading, present current pricing and expected usage for:

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
- Google Maps integration.
- External CRM.
- Automatic waitlist replacement.

These items are not required for the first production launch.
