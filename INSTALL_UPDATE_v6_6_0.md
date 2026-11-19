# Update PIR Visuals Bot to v6.6.0

## 1. Backup and extract

1. Stop the bot and website.
2. Back up source, MongoDB, `.env`, Baileys auth/session, website media, and runtime configuration.
3. Download both v6.6.0 ZIP parts.
4. Extract Part 1, then Part 2 into the SAME destination and merge the shared `PIR-Visuals-v6.6.0/` folder.
5. Copy the merged source into the installed project while preserving local/private files.

## 2. Preserve local files

Do not overwrite `.env`, auth/session folders, backups, `node_modules`, allowlists, custom aliases, bot settings, `content/texts.json`, database dumps, or uploaded media. The release ZIP excludes these files. If your runtime `content/texts.json` is customized, merge only new menu/tutorial keys from `content/texts.example.json` when required; do not replace the entire local file.

## 3. Dependencies and versions

- Node.js 18+ recommended.
- No new runtime npm dependency.
- Bot package: v6.6.0.
- Website package: v3.49.0.

```bash
npm ci
npm ci --prefix portfolio-website
```

## 4. Database indexes and compatibility

v6.6.0 adds three collections and indexes:

- `designseasons`: unique season code, one active season per group (partial unique index), and group/status listing.
- `designseasonsubmissions`: unique entry code, one submission per user per round, and group/round gallery index.
- `creativeassets`: unique group-scoped asset code, group visibility/category listing, and owner collection listing.

No existing collection is dropped and no destructive migration is required. Create and verify the additive indexes before enabling the features:

```bash
npm run db:ensure-shared-indexes
npm run verify:database
```

Older bot source does not use these new collections. If rolling back, keep the collections and indexes; do not manually drop them. Existing v6.5.1 data remains unchanged.

## 5. Generate command docs and run checks

```bash
npm run docs:commands
npm run check
node --test tests/creative-studio.test.js tests/image-utilities.test.js tests/music-discovery.test.js tests/command-catalog.test.js tests/command-routing.test.js tests/command-search.test.js tests/ensure-shared-indexes.test.js tests/verify-shared-db.test.js
npm run website:check
node --test portfolio-website/tests/creative-studio-page.test.js portfolio-website/tests/command-explorer.test.js
npm run audit:release
npm test
npm run website:test
```

Install dependencies in both root and website before treating full-suite dependency-load failures as code failures.

## 6. WhatsApp staging — Creative Asset Studio

- In a test group, run `.assetstudio help`.
- Save an HTTPS reference with `.assetstudio simpan Judul | kategori | https://tautan | lisensi | atribusi`.
- Confirm `.assetstudio saya` shows the asset but `.assetstudio cari` does not show it before sharing.
- Run `.assetstudio bagikan KODE` without confirmation and verify no visibility change.
- Run `.assetstudio bagikan KODE konfirmasi`; verify another member can search/detail it.
- Run `.assetstudio privat KODE`; verify it disappears from group search.
- Test a second group and verify no cross-group visibility.
- Verify Admin hide/restore only applies to group-shared records. Verify non-Admin cannot moderate.
- Confirm the bot stores only a URL/metadata record and does not fetch or re-upload the source file.

## 7. WhatsApp staging — Design Seasons

- Admin creates a draft with `.designseason buat Judul | brief tema | kategori`.
- Add at least two rounds using `.designseason ronde tambah KODE Judul | brief | kategori | 24`.
- Start with `.designseason mulai KODE`; verify the first round opens and receives an end time.
- Submit one work per participant/round. Updating a work should reset earlier feedback.
- Verify a second round cannot open while the current round remains open.
- Close the round, verify peer review is frozen, then open the next round.
- Hide an entry and verify the participant cannot bypass moderation by resubmitting.
- Close the last round and verify final results become available only after completion.
- Test Admin, creator, participant, unrelated member, and at least two groups.
- Let a round expire and invoke `.designseason lihat KODE`; verify the expired round is reconciled. No background scheduler is used.

## 8. Media and website staging

- Test `.sticker`, `.sticker bulat`, `.sticker 1:1`, and animated sticker with representative image/video inputs. Verify every sticker output remains at or below 1 MB.
- Test image inputs above the 40 MP/12,000 px guard and transformed outputs above 12 MB; they must fail with a clear message.
- Test `.music top` with Apple RSS reachable and unavailable/429 cases. It must display official links only and never send audio.
- Open `/creative-studio` on desktop and mobile in Light and Dark Mode. Check navigation, quick search, footer, contrast, card spacing, and responsive layout.
- Open `/commands` and verify the Design Seasons and Asset Studio workflows are generated from the bot registry.

## 9. Rollback

Stop bot and website, restore the previous source/package versions, and retain the three new collections and indexes. Do not delete the new collections during rollback; older source versions ignore them. Restore the pre-deployment database backup only if the database itself was changed unexpectedly or staging data must be removed.
