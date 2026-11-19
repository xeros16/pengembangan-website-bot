# PIR Visuals v5.96.0 — Website ↔ Bot Integration & Final QA Preparation

## Release scope

v5.96.0 connects the existing Designer Studio website workflow more cleanly to the WhatsApp bot. It does not introduce payment processing, checkout, commission, escrow, or a bot-mediated designer transaction flow. Public portfolio contacts remain designer-controlled and direct.

## Implemented

### Shared designer profile and portfolio data
- Aligned bot and website profile schemas around the same `designerprofiles` collection.
- Added `contactPhone` as the website-compatible alias of the bot's `publicWhatsApp`.
- Bot profile registration and edits now write both contact aliases together.
- Website profile editing writes both aliases together.
- Website public portfolio CTA now reads either alias and redirects directly to `https://wa.me/<public-number>` through a tracked click route; the route records only aggregate click analytics and does not relay messages or handle transactions.
- Website directory cards show whether a public WhatsApp contact has actually been supplied.
- Bot and website shared profile/portfolio schemas preserve website-owned fields rather than dropping them during bot-side document updates.
- Bot analytics schema now preserves website daily portfolio-view metrics.

### Website notifications in WhatsApp
- Added bot model for the existing `designernotifications` collection.
- Expanded `.studio` into a private-chat-only, read-only summary of active website services, public collections, verified testimonials, upcoming availability, new leads, active project rooms, portfolio moderation, analytics and unread notifications. Client PII and project conversations are not displayed.
- Added `.portfolio notifikasi` to read the latest unread Designer Studio notifications in a private chat.
- Added `.portfolio notifikasi semua` to inspect the latest 10 notifications without marking them read.
- Reading notifications marks only the displayed notification IDs as read and scopes every query to the linked `designerId`.
- Notification content is never shown in group chats.

### Integration diagnostics and deployment verification
- Added `.github/workflows/ci.yml` to install both lockfiles on a network-enabled GitHub runner and run the complete bot and website test suites. The workflow is authored but has not been triggered because no project repository is connected.
- Improved `verify:database` so missing `MONGO_URI` or missing `mongoose` produces a clear diagnostic rather than an uncaught import stack trace.
- Reworked `scripts/integration-doctor.js` to mirror the real dotenv precedence: root `.env` is loaded by the bot and loaded first by the website; process environment wins.
- Database matching now compares host, port, and database name instead of database name alone.
- Integration diagnostics avoid printing MongoDB credentials or SMTP secrets.
- Added `npm run smoke:deployment` to check bot `/ready` and website `/health`.
- Added `npm run verify:database` to inspect shared collections and required indexes on a staging/production database.
- Added `npm run integration:doctor`.

### Release metadata
- Bot package version: 5.96.0.
- Website package version: 3.43.0.
- Website health endpoint now reports platform release 5.96.0.
- Regression fixtures synchronized with release metadata.

## Commands

```text
.portfolio notifikasi
.portfolio notifikasi semua
.portfolio analytics
.portfolio website
```

The `.studio`, `.portfolio analytics`, and notification commands must be used in the designer's private chat with the bot.

## Validation status

See `QA_REPORT_v5_96_0.md`. Syntax checks, source-level integration tests, integration-doctor tests, and mocked deployment smoke tests can run without live MongoDB/WhatsApp. Full dependency-backed test suites, real website/bot data exchange, production database indexes, backup/restore, and live WhatsApp delivery still require staging.

## Product boundaries

- Public contact details are displayed only when the designer explicitly enters them.
- Website notifications are read on demand; this release does not send unsolicited WhatsApp messages.
- Client/designers continue to communicate directly using the public contact details.
- The bot does not accept orders, process payment, collect commissions, or mediate commercial agreements.
- Website's existing Designer Studio, analytics, profile, portfolio, availability, and client workspace features remain website-operated and share the configured MongoDB database where their collection contracts overlap.
