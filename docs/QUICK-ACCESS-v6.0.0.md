# Quick Access — PIR Visuals Bot v6.0.0

Quick Access is a personal command center for members. It stores up to eight public command favorites and, only after explicit opt-in, up to eight recent public command names.

## Commands

```text
.cepat
.cepat bantuan
.cepat tambah contrast
.cepat tambah wizard
.cepat hapus contrast
.cepat riwayat
.cepat riwayat aktif
.cepat riwayat nonaktif
.cepat riwayat lihat
.cepat riwayat hapus
.cepat reset
```

Use the configured bot prefix if it is not `.`.

## Privacy and behavior

- All Quick Access screens and settings are private-chat only. Group invocation receives a private-chat reminder and does not reveal stored preferences.
- Favorites are private to the WhatsApp account that created them.
- Recent-command history is OFF by default and must be enabled with `.cepat riwayat aktif`.
- The history stores only public top-level command names. It does not store arguments, message text, images, documents, phone numbers, or command results.
- Up to eight unique recent commands are retained, newest first.
- `.cepat riwayat nonaktif` stops future recording but retains existing history.
- `.cepat riwayat hapus` deletes recent history.
- `.cepat reset` removes favorites and history and turns history recording off.
- Owner-only, admin-only, premium-only, unknown, and navigation-only commands cannot be favorited or recorded.
- Favorite entries are shortcuts for the user to copy and run. Quick Access never executes a command automatically.

## Storage

Data is stored under `User.preferences.quickAccess`; the existing `preferences` field is Mixed, so no collection/schema migration is required. When MongoDB is unavailable, the current process provides a temporary in-memory fallback and clearly warns that it will not survive a restart.
