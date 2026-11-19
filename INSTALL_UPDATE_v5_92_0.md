# PIR Visuals Bot v5.92.0 — Install & Update

## Release scope

v5.92.0 adds persistent design-learning progress and group-scoped community challenges. The v5.91.0 designer directory remains portfolio discovery with opt-in direct contact only. No transaction or payment workflow is added.

## Before updating an existing installation

1. Stop the bot cleanly.
2. Back up the MongoDB database and the current project folder.
3. Preserve `.env`, WhatsApp auth/session folders, local uploads, backups, allowlist/configuration files, and secrets. The clean ZIP intentionally excludes runtime state.
4. Download both `PIR-Visuals-v5.92.0-Clean-Source-Part-1.zip` and `Part-2.zip`.
5. Extract both ZIPs into the same destination folder. They contain different files and neither is a standalone install.
6. Copy back the existing runtime files and secrets. Do not replace `.env` or WhatsApp auth with sample files.
7. Run `npm ci` from the project root.
8. Run `npm run check`, `npm run website:check`, `npm test`, `npm run website:test`, and `npm run audit:release`.
9. Start in staging and run the smoke tests below before production rollout.

No new environment variables are required.

## Database changes

### Learning progress

The active module and completion state are stored under `User.preferences.learningProgress`. The User schema already uses a Mixed `preferences` field, so no destructive migration is required.

### Community submissions

A new `LearningSubmission` collection stores challenge submissions and peer feedback. Mongoose schema indexes are:

- Unique `code`.
- Compound unique `{ groupJid, challengeKey, userJid }`.
- Gallery lookup `{ groupJid, challengeKey, status, updatedAt }`.

If automatic index creation is disabled in the deployment, create them manually after checking that the collection is new and contains no conflicting records:

```javascript
db.learningsubmissions.createIndex({ code: 1 }, { unique: true });
db.learningsubmissions.createIndex(
  { groupJid: 1, challengeKey: 1, userJid: 1 },
  { unique: true }
);
db.learningsubmissions.createIndex(
  { groupJid: 1, challengeKey: 1, status: 1, updatedAt: -1 }
);
```

Do not drop or rewrite existing collections. The new collection is additive.

## Main commands

### Learning
```text
.designlearn jalur
.designlearn mulai pemula warna
.designlearn selesai
.designlearn lanjut
.designlearn progress
.designlearn reset konfirmasi
```

### Community challenge
```text
.designchallenge harian
.designchallenge mingguan poster
.designchallenge help
.designchallenge submit Judul karya | https://tautan-karya | refleksi
.designchallenge galeri
.designchallenge feedback KODE 5 Masukan spesifik dan membangun
.designchallenge progress
.designchallenge kontributor
.designchallenge hide KODE alasan (Admin grup/Owner)
.designchallenge restore KODE (Admin grup/Owner)
```

To submit an image, send the image in the group with the `designchallenge submit` command in its caption. For a link submission, use HTTPS. The bot does not download or host linked artwork.

## Staging smoke tests

1. Confirm `.designlearn jalur` lists 12 modules.
2. Start learning progress with two test accounts; verify that progress is private to each account.
3. Complete a lesson, advance, and verify that reset requires explicit confirmation.
4. Confirm lessons can be read without MongoDB but progress writes do not claim success.
5. Verify daily and weekly challenge periods use WIB.
6. Submit a link and an image-caption entry in a test group.
7. Verify `.designchallenge galeri` only shows entries from that group and period.
8. Verify one member cannot review their own work or submit duplicate feedback.
9. Verify ordinary members cannot hide entries; group Admin/Owner can hide and restore.
10. Verify no internal JID or phone number appears in gallery output.
11. Verify challenge submissions do not appear in the public designer directory.

## Rollback

Stop the bot and restore the previous source plus the pre-update database backup if staging fails. The new `LearningSubmission` collection and `User.preferences.learningProgress` field are additive; do not drop them during rollback. The v5.91 portfolio-directory data and historical transaction collections must remain intact.
