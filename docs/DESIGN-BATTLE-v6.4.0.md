# Design Battle — v6.4.0

## Commands
```text
.designchallenge battle help
.designchallenge battle buat Poster Komunitas | Buat poster ajakan berbagi ilmu desain. | poster | 48
.designchallenge battle list
.designchallenge battle lihat KODE
.designchallenge battle submit KODE Judul karya | https://tautan-karya | refleksi
.designchallenge battle galeri KODE
.designchallenge feedback KODE-KARYA 5 Masukan yang spesifik dan membangun
.designchallenge battle hasil KODE
.designchallenge battle tutup KODE
```

## Rules and lifecycle
- Create/close is restricted to a group Admin or verified bot Owner; the creator can also close their own battle.
- Battles belong to exactly one `groupJid`; list/detail/gallery/results/submissions always filter by the current group.
- Duration is 1–168 hours. The default is 48 hours.
- At most one open battle is allowed per group; expired open records are closed before a new battle is created, and a partial unique index prevents concurrent duplicate opens.
- Category must be one of poster, branding, ui, social, packaging, illustration, typography, or photography.
- A participant explicitly opts in by submitting a work link (HTTPS) or attaching an image to the group message.
- A participant has one active entry per battle and can update it until the battle closes; replacing the work resets previous peer reviews so scores are not attached to an older version.
- Existing `.designchallenge feedback` is reused for constructive peer review; authors cannot review their own work and each reviewer can review a work once.
- Existing `.designchallenge hide` / `restore` moderation applies to battle entries; participants cannot bypass a hidden state by resubmitting.
- Gallery and final peer-review summary remain available after closure; new peer reviews are rejected after closure so final scores are immutable.
- Result ordering is a summary of member-provided scores, not an objective AI quality score or professional certification.
- No automatic prize, payment, public profile publication, or external sharing.

## Data
- `DesignBattle` stores code, group, creator, title, brief, category, start/end time, and close state.
- `LearningSubmission` stores entries with `challengeMode: 'battle'` and `challengeKey: 'battle:<CODE>'`.
- Unique `(groupJid, challengeKey, userJid)` prevents duplicate active entry records for the same member/battle.
- `designbattles` uses a unique code index, a partial unique one-open-battle-per-group index, and a group/status/end-time compound index.
- Run `npm run db:ensure-shared-indexes` and `npm run verify:database` after deployment.

## Privacy
- User-facing output shows display names and work codes, not JIDs or phone numbers.
- Work links must be HTTPS; the bot does not fetch external work URLs.
- Attached images are referenced through the original group message; the bot does not upload them to a public gallery.
