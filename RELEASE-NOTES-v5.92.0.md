# PIR Visuals Bot v5.92.0 — Learning Path & Community Challenge

## Summary

v5.92.0 turns the existing design-learning material and challenge library into a connected community learning loop: study a module, practice through a daily/weekly challenge, share the result in a group, and exchange constructive peer feedback.

## What changed

- Expanded `.designlearn` into a 12-module path: beginner, intermediate, and advanced × fundamentals, color, typography, and layout.
- Added `.designlearn jalur`, `.mulai`, `.lanjut`, `.selesai`, `.progress`, and confirmation-protected `.reset`.
- Persisted each member's current module, completed modules, and completion notes under `User.preferences.learningProgress`; no User schema migration is required.
- Kept the legacy `.designlearn <level> [topic]` syntax and allowed lesson reading without MongoDB; progress writes correctly report when the database is unavailable.
- Changed daily/weekly challenge periods from UTC to `Asia/Jakarta` (WIB).
- Added group-scoped challenge submissions using an HTTPS artwork URL or an image message posted with the command.
- Added group-only gallery, personal participation summary, contributor board, and peer feedback.
- Added feedback protections: no self-review, one feedback per member per artwork, and a minimum constructive comment length.
- Added group-admin/Owner hide and restore controls for challenge gallery entries. Moderation actions are scoped to the originating group.
- Added `LearningSubmission` model with unique submission code, one entry per group/challenge/member, group/period lookup index, and internal moderation metadata.
- Added learning/community tutorials and refreshed onboarding recommendations, command catalog, command docs, README, roadmap, and changelog.
- Updated 17 website regression fixtures to expect the new root bot package version; website runtime/package/cache versions were not changed.

## Commands

### Learning
- `.designlearn`
- `.designlearn jalur`
- `.designlearn mulai pemula warna`
- `.designlearn lanjut`
- `.designlearn selesai [catatan]`
- `.designlearn progress`
- `.designlearn reset konfirmasi`

### Community challenge
- `.designchallenge harian [kategori]`
- `.designchallenge mingguan [kategori]`
- `.designchallenge help`
- `.designchallenge submit Judul karya | https://tautan-karya | refleksi`
- `.designchallenge submit harian poster Judul karya | https://tautan-karya | refleksi`
- `.designchallenge galeri [harian|mingguan] [kategori]`
- `.designchallenge feedback KODE 5 Masukan yang spesifik dan membangun`
- `.designchallenge progress`
- `.designchallenge kontributor`
- `.designchallenge hide KODE alasan` (group admin/Owner)
- `.designchallenge restore KODE` (group admin/Owner)

## Product boundaries

- Learning completion is self-reported; it is not a certificate or objective skill assessment.
- Challenge prompts are selected deterministically from the local challenge library.
- The bot does not download or host artwork from external links. A link must use HTTPS; an image submission is referenced by its original WhatsApp message ID.
- Gallery entries are visible only inside the group where they were submitted.
- Challenge submissions are not automatically published to the public Designer Portfolio Directory.
- Peer feedback is community input, not professional certification or AI judging.
- No automatic XP, prize, payment, order, commission, public ranking of skill, or cross-group publishing is introduced.
- Website runtime and UI were not changed in this release.

## Validation

See `QA_REPORT_v5_92_0.md`. Automated and environment limitations are explicitly recorded there. Live WhatsApp, MongoDB staging, Mongoose index creation, and real-member usability still require staging verification.
