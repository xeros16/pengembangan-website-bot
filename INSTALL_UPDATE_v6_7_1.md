# Update PIR Visuals Bot to v6.7.1

## 1. Backup and extract

1. Stop the bot process.
2. Back up the current source, MongoDB, `.env`, WhatsApp auth/session directory, and uploaded media. Keep the backup private.
3. Download both v6.7.1 ZIP parts.
4. Extract Part 1, then Part 2 into the same destination and merge the shared `PIR-Visuals-v6.7.1/` folder.
5. Copy/merge the release source into the installed project without replacing private runtime files.

## 2. Preserve local files

Do not overwrite `.env`, WhatsApp auth/session folders, database data, backups, logs, uploaded media, local allowlists, runtime aliases, or `content/texts.json`. The release ZIP excludes secrets and live session files.

Keep the new asset `assets/images/menu/pir_visuals_feature_menu.png`; `.menu`, `.help` without a topic, and `.fitur` use it when the default `.` prefix is active. If the asset is missing, the bot falls back to text. If you use a custom `PREFIX`, the poster is intentionally skipped because the artwork contains dot-prefixed examples.

## 3. Install and check

No new runtime dependency is introduced.

```bash
npm ci
npm ci --prefix portfolio-website
npm run check
npm run website:check
node --test tests/general-help.test.js tests/command-routing.test.js tests/command-catalog.test.js
npm run audit:release
```

## 4. WhatsApp staging

- Run `.menu` and verify the infographic arrives before the copyable text menu.
- Run `.help` without an argument and verify it uses the same main menu.
- Run `.fitur` and verify the poster is followed by the full category index and command counts.
- Run `.fitur cari download musik`, `.fitur kategori Tools Desain`, and `.fitur semua 2`; these should remain text responses.
- Run `.menu game` and `.pr bantuan`; existing game-specific menus and help artwork should remain unchanged.
- Temporarily rename the poster asset and verify `.menu` still returns text. Restore the asset after the test.
- If using a custom `PREFIX`, verify `.menu` remains text-only and all commands use the configured prefix.
- Test both private chat and an allowed group.

## 5. Compatibility and rollback

- Bot package: `6.7.1`; website package: `3.50.0`.
- No MongoDB schema/index migration is required.
- To roll back, restore the previous source files and package version. No database rollback is needed.
