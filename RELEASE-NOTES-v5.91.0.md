# PIR Visuals Bot v5.91.0 — Designer Portfolio & Direct Contact Directory

## Summary

The WhatsApp marketplace bot is now a portfolio discovery directory. Prospective clients browse approved work, open a designer profile, and contact the designer directly using contact channels the designer has explicitly chosen to publish.

## What changed

- Replaced the transaction-oriented marketplace model with portfolio discovery and direct contact.
- Removed active request, offer, order, delivery, revision, transaction review, payment-ledger, finance, dispute, and order-notification handlers from the bot feature.
- Disabled legacy `.requestdesign`, `.client`, `.klien`, `.service`, and `.layanan` flows with clear migration guidance.
- Retained old MongoDB schemas solely to preserve historical records; active bot code no longer imports or queries those models.
- Added `publicWhatsApp`, normalized to 8–15 digits and displayed only after explicit designer input.
- Kept `contactJid` internal; public profile output never falls back to account identity or internal JID.
- Replaced the profile wizard pricing questions with optional location and explicit public WhatsApp contact.
- Removed price and transaction-rating display from directory search and designer profiles.
- Added `.design lokasi <kota>` and public-profile text search; directory search requires approved portfolio work.
- Reworked `.studio` into portfolio status and reach analytics.
- Reworked `.marketadmin` into directory moderation: designers, pending work, reports, and recent activity.
- Updated onboarding, need-based search synonyms, command catalog, tutorials, help, README, roadmap, and operations documentation.
- Switched image-processing command module to Node's native fetch implementation (Node 18+) instead of importing `node-fetch` directly.

## New/updated user commands

- `.design`
- `.design kategori <nama>`
- `.design gaya <nama>`
- `.design lokasi <kota>`
- `.design cari <kata>`
- `.design unggulan`
- `.designer DSN-ID`
- `.portfolio daftar`
- `.portfolio edit whatsapp 6281234567890`
- `.portfolio edit whatsapp off`
- `.portfolio preview`
- `.portfolio status on|off`
- `.studio`

## Important behavior

PIR Visuals does not handle project briefs, designer selection, offers, orders, checkout, payment, escrow, commission, negotiation, delivery confirmation, or dispute mediation. Scope, pricing, deadlines, rights, and payment terms are agreed directly between the prospective client and designer outside the bot.

Existing designers must explicitly opt in to public WhatsApp display. Old `contactJid` values are not exposed. Existing transaction records are not deleted or migrated.

## Validation

See `QA_REPORT_v5_91_0.md`. Live WhatsApp, MongoDB staging, and real-user contact-consent tests remain deployment prerequisites.
