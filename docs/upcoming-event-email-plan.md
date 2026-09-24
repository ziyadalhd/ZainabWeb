# Upcoming-event email broadcasts

Status: **deferred by the owner on 2026-09-24**. This is a research note and a restart checklist, not an approved provider choice or an implementation plan ready for release.

## Purpose and current boundary

Send occasional announcements about upcoming events to a small list of interested contacts. The site already records a separate, opt-in email consent and provides a secure unsubscribe link. It does not send bulk email today. Transactional email through Resend is a separate, previously approved scope after domain verification; that approval does not select a provider for broadcasts.

The approved broadcast behavior is an explicit administrator action with a preview of the message and recipient count. Only contacts whose consent remains active may receive it. Unsubscribes must be respected across the site and any chosen email service. No automatic newsletter, provider integration, list export, or sending is authorized by this note.

## Research snapshot — 2026-09-24

| Service | Free allowance | Relevant constraint |
| --- | --- | --- |
| Brevo | 300 email sends per day; up to 100,000 stored contacts. | A sender address can be verified with an emailed code without authenticating its domain. Free domains such as Gmail cannot be authenticated, which may affect deliverability. The free tier includes Brevo branding. |
| Resend | 3,000 emails per month and 100 per day. | A verified sending domain is required for real sending. Its Broadcasts and audience features may fit the existing Next.js stack after the club owns a domain. |
| MailerLite | Up to 250 subscribers and 2,500 emails per month. | The free tier has a smaller contact allowance, and API sending is not available on that tier. |

Brevo is the provisional option to evaluate if the owner wants a small manual campaign before buying a domain. It has **not** been selected. Any use of a free sender address should be tested for inbox delivery before relying on it. Recheck all allowances and terms when this task resumes; they can change.

Official sources: [Brevo free limits](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan), [Brevo sender verification](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email), [Brevo unsubscribe links](https://help.brevo.com/hc/en-us/articles/9741388688402-Do-I-need-to-add-an-unsubscribe-link-to-my-emails), [Resend pricing](https://resend.com/pricing), [Resend Broadcasts](https://resend.com/blog/send-marketing-emails-with-resend-broadcasts), and [MailerLite free-plan update](https://www.mailerlite.com/help/free-plan-update-faq).

## Decisions to make when resumed

1. Choose the broadcast service and sender address. Confirm whether sending before buying a custom domain is acceptable despite the deliverability limitation.
2. Choose a manual provider campaign or an administrator-triggered site integration. Both must use the existing consent and unsubscribe rules.
3. Decide how the provider's unsubscribes and the site's unsubscribe state stay aligned before every send. Do not re-import or send to a contact who opted out in either place.

## Restart checklist

1. Recheck official free-tier limits, sender rules, and privacy terms.
2. Inspect the current interested-contact and unsubscribe implementation; keep personal data in the approved Supabase boundary.
3. Record the owner's provider and sender decisions in `docs/architecture-decisions.md` and resolve the matching questions in `docs/open-questions.md`.
4. Design the administrator preview, recipient count, send confirmation, unsubscribe reconciliation, and failure handling. Test against the development environment before any production change.

No account, API key, campaign, database migration, or site code was created for this deferred task.
