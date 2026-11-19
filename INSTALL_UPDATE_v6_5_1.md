# Update PIR Visuals Bot to v6.5.1

## 1. Backup and extract

1. Stop the bot and website.
2. Back up source, MongoDB, `.env`, Baileys auth/session, website media, and runtime configuration.
3. Download both v6.5.1 ZIP parts.
4. Extract Part 1, then Part 2 into the SAME destination and merge the shared `PIR-Visuals-v6.5.1/` folder.
5. Copy the merged source into the installed project while preserving local/private files.

## 2. Preserve local files

Do not overwrite `.env`, auth/session folders, backups, `node_modules`, allowlists, custom aliases, bot settings, `content/texts.json`, database dumps, or uploaded media. The release ZIP excludes these files. If your runtime `content/texts.json` is customized, merge only the existing `tutorialLearning` and `tutorialCommunity` additions from `content/texts.example.json` if you need the tutorial commands.

## 3. Dependencies

- Node.js 18+ recommended.
- No new runtime npm dependency.
- Website package: v3.48.1.

```bash
npm ci
npm ci --prefix portfolio-website
```

## 4. Database compatibility

- No new collection or index is introduced in v6.5.1.
- Existing `LearningCohort` documents remain readable.
- Open cohorts created by v6.5.0 are no longer auto-expired based on the old provisional `endsAt`. When the facilitator starts one, its end date and milestone deadlines are recalculated. Legacy milestone day offsets are reconstructed from old `dueAt` and `startsAt` fields.
- No destructive migration is required. New v6.5.1 open cohorts are stored with `startsAt: null` and `endsAt: null` until they are started; milestones also store `dueDay`. v6.5.0 can read the collection but cannot correctly start these new unstarted records. For a downgrade, restore the pre-v6.5.1 database backup together with the previous source, or archive/cancel all v6.5.1-created open cohorts before downgrading. Back up the database before deployment.

## 5. Generate docs and run checks

```bash
npm run docs:commands
npm run check
node --test tests/design-cohort.test.js tests/design-cohort-model.test.js tests/design-community.test.js tests/media-download.test.js tests/command-catalog.test.js tests/command-routing.test.js tests/ensure-shared-indexes.test.js tests/verify-shared-db.test.js
npm run website:check
node --test portfolio-website/tests/command-explorer.test.js portfolio-website/tests/visual-system-v651.test.js
npm run audit:release
npm test
npm run website:test
```

## 6. WhatsApp and database staging

- Create a cohort and leave registration open beyond the configured duration; it must not expire before `.cohort mulai`.
- Start a cohort and verify the end date is `weeks × 7 days` from the actual start.
- Verify milestones added before start receive due dates relative to actual start; verify legacy v6.5.0 milestones preserve their original day offsets.
- Leave a cohort, view personal progress, then delete personal data. Confirm only the requester's check-ins are deleted.
- Test Admin, creator, facilitator, participant, and unrelated-member permissions in at least two groups.
- Test PN/LID identity normalization with the deployed Baileys version.

## 7. Downloader and network staging

- Test public IPv4/IPv6 media links and ensure private/reserved literals and private host suffixes are rejected.
- Configure outbound firewall/egress policy to prevent access to private, loopback, link-local, metadata, and other internal networks. URL validation alone cannot guarantee safety against DNS rebinding or provider redirects.
- Test unsupported, private, 401/403, 429, timeout, and transient network provider responses.
- Verify `.mediaformat cek` remains metadata-only and does not create or send a media file.

## 8. Website visual staging

- Verify `/visual-system.css` loads with HTTP 200 and is allowed by the existing same-origin CSP.
- Check desktop and mobile layouts in both Light and Dark Mode.
- Confirm the background pattern is sparse, the organic outline does not overlap content, and cards/labels/buttons remain readable.
- Confirm navigation action buttons have consistent spacing and the mobile theme toggle does not touch adjacent controls.
- Test Command Explorer search against both command and workflow titles/steps, category filtering, no-results state, and copy fallback.

## 9. Rollback

Stop bot and website, restore the previous source and package versions, and restore the pre-v6.5.1 database backup if v6.5.1-created cohorts exist. Do not run v6.5.0 against new v6.5.1 open cohort records with null start/end dates; its older lifecycle handler is not compatible with that state. No new collection/index is introduced in this patch.
