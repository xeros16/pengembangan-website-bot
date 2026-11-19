# Creative Asset Studio v6.6.0

## Purpose

A group-scoped reference library for designers. The bot stores metadata and an HTTPS link; it does not download, mirror, or upload the linked file.

## Commands

```text
.assetstudio help
.assetstudio simpan Judul | kategori | https://tautan | lisensi | atribusi/catatan
.assetstudio saya
.assetstudio cari <kata kunci>
.assetstudio detail KODE
.assetstudio bagikan KODE konfirmasi
.assetstudio privat KODE
.assetstudio hapus KODE konfirmasi
.assetstudio moderasi hide KODE [alasan]
.assetstudio moderasi restore KODE
```

## Privacy and permissions

- A new asset is private to its owner by default.
- Only the owner can share, return to private, or soft-delete their asset.
- Sharing requires the exact `konfirmasi` argument.
- Group search only returns active records with `visibility: group` in the current group.
- A member cannot inspect a private or Admin-hidden record belonging to another member.
- Admin moderation can hide/restore only group-shared records; Admins cannot browse private records through the group command.
- Asset records are isolated by `groupJid`; code alone is never used as the access boundary.
- The source URL must be HTTPS, contain no credentials, and must not be an IP literal or local/private hostname.
- License and attribution are user-supplied labels/notes, not legal verification. A shared link does not grant reuse rights.

## Persistence

Collection: `creativeassets`.

Indexes:
- `groupJid_1_code_1` unique.
- `groupJid_1_visibility_1_status_1_category_1_updatedAt_-1`.
- `groupJid_1_ownerJid_1_status_1_updatedAt_-1`.

The collection is additive. Run `npm run db:ensure-shared-indexes` and `npm run verify:database`.
