# PIR Visuals Bot v6.4.0 — Community Challenge & Downloader Reliability

**Release type:** Development Candidate  
**Bot package:** 6.4.0  
**Website package:** 3.47.0

## Core PIR improvements

### Designer contribution profile
- Added `.designcommunity ringkasan` for the current member's group-scoped learning, challenge, peer-review, mentor opt-in, and collaboration activity.
- Summary is private to the requesting member and current group; no WhatsApp JID/phone identifier is displayed.
- Counts are bounded to recent group submissions for feedback detail and are described transparently.

### Design Battle
- Added time-boxed group competitions through `.designchallenge battle`.
- Admin/Owner creates and closes battles; at most one battle is open per group; participants opt in by submitting an HTTPS work link or an image attached to the group message.
- One active entry per member per battle; entries can be updated while the battle is open.
- Group-scoped gallery, existing constructive peer-review flow, and final score summary after closure with peer reviews frozen at close; changing a work resets its previous reviews and hidden entries cannot bypass Admin moderation.
- Battle submissions reuse the existing `LearningSubmission` model; a new `DesignBattle` collection stores the event brief and lifecycle with unique-code and partial unique active-group indexes.
- New additive indexes are included in `npm run db:ensure-shared-indexes` and `npm run verify:database`.

### Group Admin Control Center
- Added read-only `.modstatus` for anti-link, anti-spam, blocked-word filter, welcome/goodbye and rules status.
- Added `.modpreset preview` and `.modpreset apply ... konfirmasi`.
- Presets change only named fields; blocked-word lists, custom rules, and unrelated settings are preserved. Apply requires a matching same-admin/same-group preview no older than five minutes and rechecks that relevant settings have not changed.
- Only group Admin or verified bot Owner can preview/apply a preset; preview never writes to the database.

### Command Explorer website
- Added public `/commands` page, linked from the website navigation.
- Search and category filters are generated from the same runtime `COMMAND_CATALOG` as WhatsApp help.
- Added copy-example controls and access labels.
- `npm run docs:commands` now generates both `docs/commands.md` and `docs/commands.json`.
- Website package advanced to 3.47.0; public cache epoch advanced to v43 and static asset query version to 6400.

## General/multifunction feature — Downloader Reliability
- Added at most one application-level retry for transient network and HTTP 429 failures only; yt-dlp internal retries are disabled so access-denied and unsupported failures are not silently retried.
- HTTP 401/403, unsupported URLs, private/unavailable media, and local dependency failures are not retried.
- Active download jobs now expose a phase and retry attempt through `.dl status`.
- `.dl cancel` can abort the requester's queued or active subprocess when the runtime supports AbortSignal; cancellation during WhatsApp send cannot recall a file already being sent.
- Downloader health now checks optional FFprobe in addition to Python/yt-dlp and FFmpeg.
- Added FFprobe audio metadata inspection for title, artist, album, duration, and format.
- Audio MIME types are selected by file extension rather than assuming every non-MP3 file is Opus.
- Existing size caps, queue limit, public URL validation, Pinterest public metadata fallback, cleanup, and download-rights guidance remain in place.

## Compatibility and data
- No new npm dependency.
- Additive MongoDB `DesignBattle` collection and indexes; no destructive migration.
- Existing `LearningSubmission` records remain valid; enum now also accepts `battle`.
- Keep `.env`, Baileys auth, allowlists, local bot settings, `content/texts.json`, and database data from the installed instance.
- Website and bot share the same source release archive, but the website package version is updated because `/commands` is a public website feature.

## Verification boundary
- Focused automated tests cover Design Battle lifecycle and permissions, contribution-summary privacy/scope, moderation preview/apply behavior, command registry generation and website route, retry policy, active cancellation, audio MIME mapping, and FFprobe metadata parsing.
- Live WhatsApp/Baileys, MongoDB index creation, yt-dlp/FFmpeg/FFprobe, and real public-site browser checks still require staging.
- Full test suites in this development environment may have dependency-load failures when `mongoose` or `sharp` are not installed. See `QA_REPORT_v6_4_0.md`.
