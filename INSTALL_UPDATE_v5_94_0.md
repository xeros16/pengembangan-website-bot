# PIR Visuals Bot v5.94.0 — Install & Update

## Before updating

1. Stop the bot cleanly.
2. Back up the project folder and MongoDB database.
3. Preserve `.env`, WhatsApp authentication/session folders, local uploads, backups, allowlists, and local settings.
4. Extract the clean source package into a separate staging folder first.
5. Copy required runtime secrets/configuration from the existing installation; never replace them with sample files.
6. Run `npm ci` from the project root in a network-enabled environment.
7. Run `npm run check`, `npm run website:check`, `npm test`, `npm run website:test`, and `npm run audit:release`.
8. Complete the staging smoke tests in `docs/SUPPORT-CENTER.md`.
9. Deploy only after staging verification succeeds.

No new environment variables are required. The website package version is unchanged.

## Database changes

The existing `Report` and `Ticket` collections gain optional display-name, review/closure metadata, and compound indexes. Existing documents remain compatible. No destructive migration or collection drop is required.

If automatic index creation is disabled, review the existing indexes and create the following additive indexes manually:

```javascript
db.reports.createIndex({ groupJid: 1, status: 1, createdAt: -1 });
db.tickets.createIndex({ groupJid: 1, status: 1, createdAt: -1 });
db.tickets.createIndex({ userJid: 1, status: 1, createdAt: -1 });
```

Do not drop existing indexes without checking production query usage.

## New support commands

```text
.support
.support faq
.support faq tidak merespons
.support ticket
.support laporan
.ticket buka Bot tidak merespons setelah command
.ticket saya
.ticket list
.ticket balas <ID> <pesan>
.ticket tutup <ID>
.report @anggota | alasan laporan yang jelas
.reports
.reports detail <ID>
.reports tutup <ID> [catatan]
.health
```

Group Admin ticket/report actions are restricted to the originating group. The bot Owner can manage tickets and reports globally. Ticket owners can close their own tickets.

## Maintenance mode

Support/discovery commands remain available while maintenance mode is enabled: `.help`, `.menu`, `.mulai`, `.cari`, `.support`, `.ticket`, `.report`, and `.reports`.

## Rollback

Stop the bot and restore the previous source plus the pre-update database backup if staging fails. The added fields are optional and additive; do not drop Report or Ticket collections during rollback.
