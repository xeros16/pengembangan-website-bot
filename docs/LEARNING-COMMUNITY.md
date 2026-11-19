# PIR Visuals v5.92.0 — Learning & Community Guide

## Product scope

v5.92.0 connects three existing community capabilities into a practical learning loop:

1. Learn a design concept through a structured module.
2. Practice through a daily or weekly design challenge.
3. Share the result in the current group and receive constructive peer feedback.

This is a learning/community feature, not a certification system, automated judging service, public portfolio publisher, or transaction service.

## Learning Path

The curriculum contains 12 modules: three levels (`pemula`, `menengah`, `lanjutan`) multiplied by four topics (`dasar`, `warna`, `tipografi`, `layout`).

| Command | Purpose |
|---|---|
| `.designlearn` | Open Learning Center help |
| `.designlearn jalur` | View all 12 modules and completion markers |
| `.designlearn mulai pemula warna` | Set the active module and show its lesson |
| `.designlearn pemula warna` | Legacy-compatible lesson display |
| `.designlearn lanjut` | Open the next module after completing the current one |
| `.designlearn selesai [catatan]` | Mark the active module complete by self-confirmation |
| `.designlearn progress` | View personal progress |
| `.designlearn reset` | Show reset confirmation instructions |
| `.designlearn reset konfirmasi` | Reset only the caller's learning progress |

Progress is stored under `User.preferences.learningProgress`; no new User collection or destructive migration is required. If MongoDB is unavailable, users can still read lessons, but progress cannot be saved or retrieved.

Completion is self-reported. It must not be described as proof of skill, a certificate, or an objective assessment.

## Community Design Challenge

Daily and weekly challenge periods use `Asia/Jakarta` (WIB). The same group members therefore see the same challenge key for a given mode, period, and category.

| Command | Purpose |
|---|---|
| `.designchallenge` | Show today's challenge |
| `.designchallenge harian [kategori]` | Show daily challenge |
| `.designchallenge mingguan [kategori]` | Show weekly challenge |
| `.designchallenge help` | Show full usage |
| `.designchallenge submit Judul karya \| https://tautan-karya \| refleksi` | Submit to today's all-category challenge |
| `.designchallenge submit harian poster Judul karya \| https://tautan-karya \| refleksi` | Submit to a selected daily category |
| Send an image with `.designchallenge submit harian poster Judul karya \| \| refleksi` | Record an image message posted in the group |
| `.designchallenge galeri` | Show submissions for the current daily period in this group |
| `.designchallenge galeri mingguan` | Show submissions for the current weekly period in this group |
| `.designchallenge feedback KODE 5 Masukan spesifik dan sopan` | Give one peer review to another member's work |
| `.designchallenge progress` | View the caller's group participation |
| `.designchallenge kontributor` | View the most active contributors in this group |
| `.designchallenge hide KODE <alasan>` | Hide a submission from this group's gallery (group admin/Owner) |
| `.designchallenge restore KODE` | Restore a hidden submission (group admin/Owner) |

### Submission rules

- Submission, gallery, feedback, and contributor queries require a group chat.
- A submission belongs to one `groupJid`, one challenge key, and one member. A later submission for the same challenge updates that member's entry.
- Artwork is represented by an HTTPS URL or by the WhatsApp image message where the command was posted.
- The bot does not fetch, download, re-host, or verify rights for externally linked artwork.
- The gallery only returns active entries for the current group and period. It does not publish to the Designer Portfolio Directory.
- Group admins or the bot Owner can hide/restore a submission within that group. Moderation notes remain internal and are not shown in the gallery.
- The bot does not expose internal JIDs or phone numbers in the gallery.

### Peer review rules

- Members cannot review their own work.
- One member may submit one peer review per artwork.
- Scores are an appreciation signal from peers, not a professional ranking or automated quality score.
- Comments must be at least 12 characters to encourage actionable feedback.
- Encourage reviewers to mention one strength and one specific improvement.

## Data and privacy

- Learning progress is per `User.jid` and remains private to that account.
- Challenge entries are scoped by `groupJid`; the same work is not visible to other groups through this feature.
- `userName` is the WhatsApp display name supplied with the message; no phone/JID fallback is shown publicly.
- `LearningSubmission` stores challenge metadata, a short public reference code, optional HTTPS work URL, original message ID for image posts, reflection, and feedback.
- Do not use the challenge gallery as a substitute for the Designer Portfolio Directory. Portfolio publication still requires the existing opt-in profile flow and Owner moderation.
- No payments, orders, commissions, prizes, automatic XP, AI scoring, or cross-group publishing are introduced.

## Operations

1. Ensure MongoDB is connected and the `LearningSubmission` indexes are created by Mongoose.
2. Back up the database before deploying the release.
3. Run the automated learning tests and full test suite after installing dependencies.
4. In a staging group, test a daily challenge, a weekly challenge, a link submission, an image-caption submission, gallery visibility, feedback, self-feedback rejection, duplicate-feedback rejection, admin hide/restore, and cross-group isolation.
5. Test `.designlearn` persistence using two different WhatsApp test accounts.
6. Verify that no internal JID or phone number appears in learning/community outputs.

## Known limitations

- WhatsApp image posts are referenced by their original message ID; the bot does not copy the media into a separate hosted gallery.
- A gallery entry with a WhatsApp image therefore instructs members to find the original message in the same group.
- Learning completion is a manual confirmation.
- The challenge library is local and deterministic; it is not an externally curated challenge feed.
- No automatic reminders or scheduled challenge announcements are created.
