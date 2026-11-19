# Operations Runbook — PIR Visuals Bot v5.92.0

## Operating boundaries

- Learning progress is private to each WhatsApp account.
- Challenge submissions, gallery entries, peer feedback, and moderation are scoped to the originating group.
- Challenge gallery content is not automatically published to the public Designer Portfolio Directory.
- The bot does not certify skills, automatically judge artwork, award prizes/XP, host external artwork, process payments, or mediate client/designer transactions.

## Daily operation

- Daily challenge date rolls over at 00:00 Asia/Jakarta (WIB).
- Weekly challenge uses an ISO week derived from the current WIB date.
- Members can read lessons without MongoDB, but progress cannot be saved while the database is unavailable.
- Challenge submission, gallery, feedback, contribution board, and moderation require MongoDB and a group context.

## Learning commands

- `.designlearn jalur` — curriculum overview.
- `.designlearn mulai <level> <topik>` — set active lesson.
- `.designlearn selesai [catatan]` — mark the active module complete by self-confirmation.
- `.designlearn lanjut` — advance after the current module is complete.
- `.designlearn progress` — inspect personal progress.
- `.designlearn reset konfirmasi` — reset only the caller's progress.

Progress is stored in `User.preferences.learningProgress`. Do not use it as a certificate, employee evaluation, or proof of professional competence.

## Challenge commands

- `.designchallenge harian [kategori]`
- `.designchallenge mingguan [kategori]`
- `.designchallenge submit <judul> | <HTTPS URL> | <refleksi>`
- `.designchallenge galeri [harian|mingguan] [kategori]`
- `.designchallenge feedback <KODE> <1-5> <masukan>`
- `.designchallenge progress`
- `.designchallenge kontributor`

Image submissions are linked to the original WhatsApp message ID. If the original message is deleted or unavailable, the bot does not have a separate hosted media copy.

## Moderation

Only a group Admin or bot Owner can moderate submissions within the current group:

- `.designchallenge hide <KODE> <alasan>`
- `.designchallenge restore <KODE>`

Moderation updates only the record matching both the code and current `groupJid`. The note, actor, and timestamp are stored internally and are not shown in the public gallery. Moderation is for group-content suitability, not commercial disputes or designer/client agreements.

## Database and backup

- Confirm the `LearningSubmission` collection indexes exist after deployment.
- Include the new collection in normal MongoDB backups.
- Verify backup restoration in staging before production.
- Do not remove historical portfolio or marketplace collections.
- If MongoDB is unavailable, do not report a challenge submission or learning progress as saved.

## Incident response

- Inappropriate submission: group Admin/Owner hides it, then reviews the original group message under normal group rules.
- Wrong-group visibility: inspect the query and confirm all gallery, feedback, and moderation operations include `groupJid`.
- Public phone/JID exposure: hide the entry, preserve logs, inspect output formatter, and remove the exposed field; do not use internal JID as a public identity.
- Duplicate submission: verify the unique compound index and the upsert filter `{ groupJid, challengeKey, userJid }`.
- Duplicate peer review: verify the `feedback.reviewerJid` exclusion condition and inspect the record.
- Database failure: stop write operations, preserve logs, and restore only from a verified backup.

## Production readiness boundary

Automated tests do not verify live WhatsApp image-caption handling, MongoDB index creation, concurrency under live group traffic, or member understanding of peer-review etiquette. Complete staging smoke tests before production rollout.
