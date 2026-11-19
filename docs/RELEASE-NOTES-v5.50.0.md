# PIR Visuals v5.50.0 — Support Center & Light Theme Refinement

## Light mode and spacing
- Reworked light-mode semantic tokens for warmer neutral surfaces and darker readable text.
- Added explicit contrast overrides for navigation, cards, headings, muted text, tags, buttons, form controls, designer workspace, shortlist and public profiles.
- Standardized common page, card, hero, grid and form spacing to reduce inconsistent padding.
- Added focused mobile spacing adjustments.

## Contact & Customer Support
- Added a real `/contact` page with contact channels, service hours and a customer support request form.
- Support email and WhatsApp channels are configured with SUPPORT_EMAIL and SUPPORT_WHATSAPP.
- Support hours are configurable with SUPPORT_HOURS.
- Support form validates name, email, subject and message; includes a honeypot and rate limit.
- Tickets are persisted in MongoDB `portfoliosupporttickets`.
- When SMTP and SUPPORT_EMAIL are configured, new tickets also trigger an email notification.
- Ticket reference is shown to the visitor after successful submission.

## Owner dashboard
- Added protected Customer Support Inbox to `/dashboard`.
- Owner can move active tickets to in-progress, resolved or closed.
- Status changes use owner Basic Auth, same-origin check and CSRF token.

## Compatibility
- No changes to WhatsApp Baileys or game modules.
- Existing designer-to-client direct contact flow is retained.
- New support collection is additive; existing collections are unchanged.

## Validation
- Website syntax check passed.
- Website automated tests: 102/102 passed.
- Bot syntax check passed (173 JavaScript files).
- ZIP integrity validated.
