# PIR Visuals Bot v5.95.0 — Install & Update

## Before updating

1. Stop the bot cleanly.
2. Back up the current source folder and MongoDB database.
3. Preserve `.env`, WhatsApp auth/session folders, allowlists, command aliases, bot settings, local subscription/history files, uploads, backups, and any custom configuration. The clean ZIP intentionally excludes runtime state and secrets.
4. Download BOTH `PIR-Visuals-v5.95.0-Production-Readiness-Part-1.zip` and `Part-2.zip`.
5. Extract both archives into the SAME destination folder. Neither archive is a standalone installation.
6. Restore the existing runtime configuration and session files without replacing them with examples.
7. Run `npm ci` from the project root on a network-enabled host.
8. Run the validation commands below and complete staging smoke tests before production.

## Validation commands

```bash
npm ci
npm run check
npm run website:check
npm test
npm run website:test
npm run docs:commands
npm run audit:release
```

The release source has been syntax-checked and the focused tests passed in the build workspace. The full dependency-backed suites still require a successful `npm ci`.

## Database changes

No new collections or destructive migrations are introduced. v5.95.0 adds these indexes to existing collections:

- Report: `{ groupJid: 1, reporterJid: 1, createdAt: -1 }`
- Ticket: `{ userJid: 1, createdAt: -1 }`

Existing Report/Ticket indexes and documents remain in place. If automatic index creation is disabled, review existing indexes and create the two additive indexes in MongoDB after backup:

```javascript
db.reports.createIndex({ groupJid: 1, reporterJid: 1, createdAt: -1 });
db.tickets.createIndex({ userJid: 1, createdAt: -1 });
```

Do not drop collections or remove historical records.

## Support commands

```text
.support
.support faq
.support ticket
.ticket buka Ringkasan kendala minimal delapan karakter
.ticket saya
.ticket detail ID
.ticket list
.ticket balas ID Pesan balasan
.ticket tutup ID
.report @anggota | alasan laporan yang jelas
.reports
.reports detail ID
.reports tutup ID Catatan penyelesaian
.health
```

Access and limits:
- Ticket owner, originating group Admin, and Owner can read ticket detail.
- Admin ticket access is restricted to the originating group.
- Ticket reply is available to originating group Admin or Owner.
- Ticket close is available to ticket owner, originating group Admin, or Owner.
- Three open tickets and five new tickets per rolling 24 hours per account.
- Three reports per member/group per rolling 10 minutes.

The count-based throttles are best-effort under concurrent traffic. They are not a distributed atomic rate-limiting service.

## Rollback

Stop the bot, restore the previous source package, and restore the pre-update database backup only if required. The new indexes are additive and can remain during source rollback. Do not drop Report or Ticket collections or remove historical documents.

## Production gate

Do not deploy as a stable release until the complete test suites pass, live WhatsApp/MongoDB staging succeeds, group isolation is verified, and backup/restore is tested.
