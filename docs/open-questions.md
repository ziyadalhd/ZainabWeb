# Open Questions

This document tracks product and architecture decisions that require explicit user approval. Do not silently resolve these questions. When an answer affects security, persistence, an external integration, or business behavior, obtain approval before implementation and record the approved decision in the appropriate documentation.

## Data and persistence

- Which database provider, if any, should the application use?
- Which ORM or database access approach should the application use?

## Authentication and authorization

- Which admin authentication provider or approach should be used?
- Public user accounts are not approved. Should they remain excluded?

## Messaging and reminders

- Which messaging provider, if any, should be used?
- Which channel should be used for reminders and confirmations: WhatsApp, SMS, email, or another approved channel?
- What are the attendance-reminder schedules?

## Hosting and operations

- Which hosting provider should be used?

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

- Are any external integrations approved? None are approved currently.
- Online payments, ticket generation, newsletter functionality, Google Maps, Guest CRM or Mini-CRM, public user accounts, and automatic waitlist replacement remain excluded unless the user explicitly approves them.
