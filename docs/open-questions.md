# Open Questions

This document tracks product and architecture decisions that require explicit user approval. Do not silently resolve these questions. When an answer affects security, persistence, an external integration, or business behavior, obtain approval before implementation and record the approved decision in the appropriate documentation.

## Data and persistence

- **Resolved for phase two:** Supabase Postgres is approved for event persistence, using the Supabase client directly without an ORM.
- What personal-data retention and deletion policy should apply when registrations or survey storage is approved later?

## Authentication and authorization

- **Resolved for phase two:** Supabase Auth email/password with an `admin_users` allowlist and one initial full-access administrator.
- **Resolved for phase two:** public signup, password reset, and public user accounts remain excluded.
- **Resolved operationally:** the initial administrator was provisioned outside Git and added to `admin_users`; the account email and credentials are intentionally not recorded in repository documentation.

## Messaging and reminders

- Which messaging provider, if any, should be used?
- Which channel should be used for reminders and confirmations: WhatsApp, SMS, email, or another approved channel?
- What are the attendance-reminder schedules?

## Hosting and operations

- **Resolved for the current phase:** Vercel is the approved host and Supabase is connected through Vercel Marketplace.
- Should GitHub automatic production deployment be enabled later? It remains deferred; production deployment is manual.

## Events and calendar behavior

- What are the final calendar-conflict rules?

## Registration, cancellation, and waitlists

- What are the final waitlist-priority rules?
- Automatic waitlist replacement is excluded. Should it remain excluded?

## Forms and surveys

- What are the final fields for the workshop application survey?
- What are the final fields for the interested-contact survey?
- Are any fields beyond تقييم الضيافة, تقييم المادة, and المقترحات required for the event-feedback survey?

## Audience categories

- What are the final age boundaries for الكبار, اليافعون, and الصغار? Ages 12 and 18 currently overlap between categories and must not be assigned silently.

## Social media and contact

- What is the final TikTok URL?
- What is the final Instagram URL?

## Content and visual identity

- What is the approved club introduction?
- What is the approved explanation of the idea behind the club name?
- What are the approved club objectives and marketing content?
- What is the final visual identity, including logo assets, color palette, typography, imagery, and tone?

## External integrations and excluded capabilities

- Supabase and Vercel are approved only for the phase-two scope documented in `docs/architecture-decisions.md`. Are any additional external integrations approved? None are approved currently.
- Online payments, ticket generation, newsletter functionality, Google Maps, Guest CRM or Mini-CRM, public user accounts, and automatic waitlist replacement remain excluded unless the user explicitly approves them.
