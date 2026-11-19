# Operations Runbook — PIR Visuals Bot v5.91.0

## Operating boundary

The bot is a portfolio discovery directory. It displays public designer profiles, approved portfolio work, and contact channels the designer has explicitly published. Client and designer communicate and agree directly outside the bot.

The bot does not create briefs, offers, orders, payment records, escrow, commissions, dispute cases, or transaction status. Do not re-enable legacy request/order/payment handlers as part of routine support.

## Routine checks

- Verify WhatsApp connection state and local readiness endpoint.
- Verify MongoDB connectivity and indexes.
- Verify configured `DESIGN_COMMUNITY_GROUPS` values.
- Check `.marketadmin` for pending portfolio work and open reports.
- Review public profile contact details for consent and validity.
- Check Designer Studio profile/portfolio/contact analytics.
- Confirm backups and restore procedures independently.

## Moderation workflow

1. `.marketadmin pending [page]` lists work awaiting review.
2. Inspect the item and designer profile.
3. `.portfolio approve ART-ID` publishes suitable work.
4. `.portfolio reject ART-ID <reason>` rejects work with a concise reason.
5. `.marketadmin reports [page]` lists open content reports.
6. `.marketreport tutup RPT-ID <note>` or `.marketreport abaikan RPT-ID <note>` closes a report.

Moderation addresses directory safety and content suitability only. It does not resolve commercial disputes or guarantee a designer/client agreement.

## Public contact support

- `publicWhatsApp` is the only WhatsApp phone field intended for public display.
- `contactJid` is an internal account identity; never copy it into public output or use it as a fallback.
- Public WhatsApp is normalized to 8–15 digits and rendered as a `wa.me` URL.
- If a designer asks to hide their number, use `.portfolio edit whatsapp off`.
- If the number belongs to someone else or the designer withdraws consent, remove it promptly and record the moderation/support action.

## Legacy data

Order, offer, review, service, activity, dispute, and payment schemas remain in the model file for historical collection compatibility. The v5.91 active marketplace feature does not import or query them. Do not run cleanup scripts against these collections without a separate approved migration plan.

## Incident response

- Public contact exposed without consent: remove `publicWhatsApp`, hide the profile if necessary, and investigate source of the change.
- Inappropriate portfolio content: reject/hide the work and close the associated report with a reason.
- Wrong designer profile: verify ownership through the internal account identity, not public contact fields.
- MongoDB failure: stop write operations, preserve logs, restore only from a verified backup.
- WhatsApp disconnect: use normal reconnect runbook; do not change profile ownership/contact data to work around session issues.

## Production readiness boundary

Automated unit/static checks do not verify WhatsApp live delivery, MongoDB staging, website contact behavior, public-link reachability, or whether designers understand that their contact is public. These require a staging run with real test accounts and explicit consent.
