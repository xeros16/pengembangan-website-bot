# PIR Visuals Bot v6.1.0 — WhatsApp Workflow & Group Safety Upgrade

## Highlights

### 1. Design Brief Wizard can resume after a restart
- Drafts are stored per WhatsApp chat and account in `designbriefsessions`.
- Drafts expire after 24 hours and are also checked by application code.
- New controls: `.wizard lanjut`, `.wizard kembali`, `.wizard ulang`, `.wizard status`, and `.wizard batal`.
- The bot discloses temporary storage and explains that drafts are memory-only when MongoDB is unavailable.
- Completing or cancelling a wizard deletes its draft.

### 2. Admin-managed group word filter
- Added `.antitoxic` with add/list/remove/enable/disable/reset actions.
- Each group has its own list, capped at 30 single-token entries.
- Filter is OFF by default and only matches normalized whole words.
- Group Admins are exempt; only Admins can configure the filter.
- Message deletion depends on the bot's actual Admin permission.
- The filter does not use AI classification and does not infer context.

### 3. Warning review reminder
- Automatic moderation reminds Admins when a member reaches three warnings within a rolling 30-day window.
- The bot does not automatically kick, ban, or mute members.

### 4. Database operations
- Added unique compound and TTL indexes for brief sessions.
- Added index creation and verification to the existing database scripts.
- No destructive migration or runtime dependency was added.

## Commands

```text
.wizard
.wizard lanjut
.wizard kembali
.wizard status
.wizard ulang
.wizard batal

.antitoxic
.antitoxic tambah <kata>
.antitoxic daftar
.antitoxic on
.antitoxic off
.antitoxic hapus <kata>
.antitoxic reset
```

## Compatibility

- Bot package: `6.1.0`
- Website package: unchanged (`3.46.0` baseline)
- Node.js/Baileys/MongoDB architecture: unchanged
- Existing group anti-link, anti-spam, welcome/goodbye, rules, manual warning, and moderation log flows remain available.

## Release status

This is a source update / development candidate. Automated focused tests do not replace live WhatsApp, MongoDB TTL-index, and real group Admin-permission verification. See `QA_REPORT_v6_1_0.md` before production deployment.
