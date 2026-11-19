# PIR Visuals Designer Portfolio Directory

## Operating model (v5.97.0)

PIR Visuals Bot is a **portfolio discovery directory**. Its job is to help a prospective client discover designers, inspect approved work, and reach the designer through a contact channel the designer has explicitly chosen to publish.

The bot is not a transaction platform and does not mediate the relationship. The website additionally offers an optional private project workspace for designers and clients who choose to use it; that workspace is only a communication/progress log and does not create a PIR-mediated transaction.

### Explicitly out of scope

- No project brief or job request is submitted through the bot.
- The website may accept a brief only when a designer explicitly enables the optional project workspace; the client can always use direct contact instead.
- No offers, bids, proposals, designer selection, or order state machine.
- No checkout, payment gateway, manual payment ledger, escrow, commission, or transfer of funds.
- No bot-mediated negotiation, delivery approval, revision management, rating tied to a transaction, or dispute resolution.
- No guarantee of work quality, availability, identity, delivery, payment, or agreement between users.

After opening a designer profile, the prospective client contacts the designer directly. They discuss scope, price, timeline, revisions, rights, and payment terms outside PIR Visuals.

## For people looking for a designer

- `.design` — browse the public designer directory.
- `.design kategori <nama>` — filter by work category.
- `.design gaya <nama>` — filter by visual style.
- `.design lokasi <kota>` — filter by location.
- `.design cari <kata>` — search approved work and public designer profile text.
- `.design unggulan` — find designers with featured approved work.
- `.design next` / `.design prev` — navigate results.
- `.design simpan DSN-ID` / `.design favorit` — save and revisit a designer.
- `.designer DSN-ID` — view the designer profile, approved portfolio work, and public contact links.
- `.lapordesain DSN-ID alasan` or `.lapordesain ART-ID alasan` — report a profile or work for Owner review.

Only public profiles and approved portfolio items are shown. Search results are based on portfolio evidence, not order availability, prices, or transaction ratings.

## For designers

1. `.portfolio daftar` — create a public profile using a guided five-step wizard.
2. Enter public name, bio, specialties, optional location, and an optional public WhatsApp number.
3. A WhatsApp number is shown only if the designer explicitly enters it. The internal account JID is never used as a public contact fallback.
4. `.portfolio edit whatsapp 6281234567890` — set or update public WhatsApp contact.
5. `.portfolio edit whatsapp off` — remove public WhatsApp contact.
6. `.portfolio edit instagram <username>`, `.portfolio edit behance <username/link>`, `.portfolio edit dribbble <username/link>`, `.portfolio edit website <url>` — set optional social/website links.
7. `.portfolio add` — upload one JPEG, PNG, WebP, or SVG file directly in a private WhatsApp chat (15 MB maximum), then enter its title, category, and description. Website upload remains available; all work requires Owner moderation before public display.
8. `.portfolio preview` — preview the public profile and contact details.
9. `.portfolio website` / `.portfolio qr` — get a public portfolio link or QR route.
10. `.portfolio status on|off` — publish or hide the profile.
11. `.studio` — see approved/pending/rejected work counts, profile/portfolio views, and contact clicks.

A designer should publish only work they own or have permission to display. Do not publish private client material without authorization.

## Owner moderation

- `.marketadmin` — directory health summary.
- `.marketadmin designers [page]` — public designer profiles.
- `.marketadmin pending [page]` — works awaiting moderation.
- `.marketadmin reports [page]` — open reports.
- `.marketadmin activity` — recent profile, portfolio, and report activity.
- `.portfolio pending` — pending work queue.
- `.portfolio approve ART-ID` / `.portfolio reject ART-ID alasan` — moderate a portfolio item.
- `.portfolio verified DSN-ID on|off` — legacy command name for the **PIR-reviewed profile** badge. It means the profile was manually reviewed under `docs/VERIFICATION-STANDARD-v5.97.0.md`; it does not prove legal identity, client history, transaction, work quality, or delivery.
- `.portfolio popular DSN-ID on|off` — featured designer badge.
- `.marketreport` — review and resolve user reports.

Moderation is limited to directory safety and content quality. It is not transaction arbitration.

## Website hybrid workspace (optional)

- The public profile keeps direct WhatsApp contact as the primary route.
- If a designer enables project inquiries, the website may show an optional `/contact/:designerId` workspace path.
- The workspace stores a brief, status updates, and feedback between the client and designer.
- It does not offer checkout, payment processing, commission, escrow, dispute mediation, or payment guarantees.
- Prices, contracts, rights, delivery terms, revisions, and payments are agreed directly by the client and designer outside PIR Visuals.
- The WhatsApp bot remains a portfolio directory and direct-contact surface only; it does not create or manage website project rooms.

## Legacy compatibility

The previous versions stored order, offer, service, review, dispute, activity, and payment-ledger collections. v5.91.0 no longer imports or operates those models from the active bot feature. The legacy schemas remain in `models/design-marketplace.js` only to avoid deleting historical database collections during an update. Existing records are not migrated, deleted, displayed, or used by the current directory commands.

Old commands `.requestdesign`, `.client`, `.klien`, `.service`, and `.layanan` return a migration message directing users to the portfolio directory. Old Owner dashboard views for orders/payments/finance/ratings are disabled.

## Contact privacy

- `contactJid` remains an internal account-link identity and must never be exposed in a public profile.
- `publicWhatsApp` is the explicit public contact field, normalized to 8–15 digits and rendered as a `wa.me` link.
- Instagram, Behance, Dribbble, and website fields are optional and are displayed only when they produce a valid HTTP(S) URL.
- Removing the public WhatsApp field does not remove the designer's internal account identity.

## Data and deployment

- Requires MongoDB for profiles, works, favorites, reports, and analytics.
- `DESIGN_COMMUNITY_GROUPS` restricts profile registration to approved community groups.
- Portfolio image upload remains website-first through Designer Studio; the bot only gives upload guidance.
- Do not delete legacy MongoDB collections as part of this release.
- Validate WhatsApp live behavior, MongoDB staging, and real contact links before production rollout.
