# Update PIR Visuals Bot to v6.5.0

## 1. Backup and extract

1. Stop the bot and website.
2. Back up the current source, MongoDB database, `.env`, Baileys auth/session folder, website media, and runtime configuration.
3. Download both v6.5.0 ZIP parts.
4. Extract Part 1, then Part 2 into the SAME destination and merge the shared `PIR-Visuals-v6.5.0/` folder.
5. Copy the merged source into the installed project while preserving local configuration and session data.

## 2. Preserve local files

Do not overwrite or distribute `.env`, auth/session folders, backups, `node_modules`, allowlists, custom aliases, bot settings, runtime text overrides (`content/texts.json`), database dumps, or uploaded media. The release ZIP intentionally excludes these local/private files. If you maintain a customized `content/texts.json`, merge only the `tutorialLearning` and `tutorialCommunity` additions from `content/texts.example.json` to expose the new tutorial commands; do not replace your entire runtime text file.

## 3. Dependencies

- Node.js 18+ recommended.
- No new runtime npm dependency.
- Python + yt-dlp required for downloader metadata inspection and downloads.
- FFmpeg remains required for compression/audio extraction; FFprobe remains optional.
- Website package is v3.48.0.

```bash
npm ci
npm ci --prefix portfolio-website
```

## 4. Database indexes

The new `LearningCohort` and `LearningCohortCheckin` collections/indexes are additive. Run with a valid staging/production `MONGO_URI`:

```bash
npm run db:ensure-shared-indexes
npm run verify:database
```

No existing records or indexes are dropped. Back up the database before production deployment.

## 5. Generate docs and run checks

```bash
npm run docs:commands
npm run check
node --test tests/design-cohort.test.js tests/design-community.test.js tests/media-download.test.js tests/command-catalog.test.js tests/command-routing.test.js tests/ensure-shared-indexes.test.js tests/verify-shared-db.test.js
npm run website:check
node --test portfolio-website/tests/command-explorer.test.js
npm run audit:release
```

Then run full suites:

```bash
npm test
npm run website:test
```

## 6. WhatsApp staging acceptance

- Admin creates a cohort; unrelated members cannot create or manage it.
- Members can join/leave voluntarily; duplicate join is rejected.
- Cohort and check-in lookup is scoped to the current group; cancellation is limited to creator/Admin/Owner.
- Facilitators add milestones and review check-ins; non-facilitators cannot review.
- A participant sees only their own progress. Aggregate progress does not list names/JIDs or rank members.
- Personal data deletion removes only that member's check-ins; full cohort deletion requires creator/Admin/Owner and confirmation.
- Test group mentions for both PN and LID identities with the deployed Baileys version.
- `.designcommunity growth` shows only recorded current-group activity and private suggestions.

## 7. Media and website staging

- `.mediaformat` lists limits and the metadata-only inspection workflow.
- `.mediaformat cek <public-url>` uses yt-dlp `--ignore-config` + `--skip-download`; verify it does not create output files. Confirm the 15-second per-requester cooldown and two-call global concurrency cap.
- Test unsupported, private, 401/403, 429, timeout, and network-error provider responses.
- Verify `.mediaformat estimasi` is clearly presented as an estimate, not a conversion.
- Visit `/commands`; search/filter command cards and copy each guided workflow.
- Test light/dark mode, mobile layout, CSP, accessibility, and browser clipboard fallback.

## 8. Rollback

Stop bot and website, restore the previous source and matching package versions, and retain the database. New `learningcohorts` and `learningcohortcheckins` collections/indexes are additive and can remain during rollback; older code ignores them. Do not drop indexes or delete cohort records during rollback.
