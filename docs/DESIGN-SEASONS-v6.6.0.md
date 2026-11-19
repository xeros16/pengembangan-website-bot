# Design Seasons v6.6.0

## Purpose

Group-only multi-round design competitions. Each season has 2–8 rounds; only one round can be open at a time. Each round lasts 1–168 hours.

## Admin/creator workflow

```text
.designseason buat Creative Season | Eksplorasi identitas visual komunitas. | branding
.designseason ronde tambah KODE Babak Satu | Brief ronde pertama minimal dua puluh karakter. | poster | 24
.designseason ronde tambah KODE Babak Dua | Brief ronde kedua minimal dua puluh karakter. | branding | 24
.designseason mulai KODE
.designseason ronde tutup KODE
.designseason ronde lanjut KODE
.designseason hasil KODE
```

A season is a draft until the creator/Admin starts it. The first round is opened by `.mulai`; later rounds are opened only after the current round closes. At most one active season per group is enforced by a partial unique index.

## Participant workflow

```text
.designseason list
.designseason lihat KODE
.designseason submit KODE Judul karya | https://tautan-karya | refleksi
.designseason galeri KODE
.designseason feedback KODE-KARYA 5 Masukan yang spesifik dan membangun.
```

A work can also be submitted with an image attached to the command message. The bot stores the message ID for reference, not a copied image file. HTTPS links are validated as public-looking links; the bot does not fetch the work URL.

## Moderation and scoring

- One active submission per participant per round, enforced by a unique compound index.
- Updating an active work resets its previous peer reviews.
- One review per reviewer per work; self-review is rejected.
- Peer review is accepted only while the matching round is open and freezes when the round closes.
- Hidden entries cannot bypass moderation by resubmitting.
- Only Admin/Owner can hide or restore entries.
- Final aggregate results are available only after the season completes. The average is a summary of voluntary peer feedback, not an objective quality score, professional certification, or automatic prize decision.

## Expiry behavior

No background scheduler is introduced. An expired round is reconciled when a command reads/uses its season. If the final round has expired, the season becomes completed; if rounds remain, the Admin can open the next pending round.

## Persistence

Collections: `designseasons` and `designseasonsubmissions`.

Key indexes:
- `designseasons.code_1` unique.
- `designseasons.groupJid_1_active_unique` partial unique where `status: active`.
- `designseasonsubmissions.code_1` unique.
- `designseasonsubmissions.groupJid_1_seasonCode_1_roundCode_1_userJid_1` unique.
- `designseasonsubmissions.groupJid_1_seasonCode_1_roundCode_1_status_1_updatedAt_-1`.

Run `npm run db:ensure-shared-indexes` and `npm run verify:database` before production use.
