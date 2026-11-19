# QA Report — PIR Visuals v6.7.1

- Bot package: `6.7.1`
- Website package: `3.50.0` (unchanged)
- Release status: Development Candidate; live WhatsApp acceptance remains required.

## Source and packaging checks

- `npm run check`: passed; 278 JavaScript files passed syntax validation.
- `npm run website:check`: passed.
- `npm run docs:commands`: passed; generated command catalog is current.
- `npm run audit:release`: passed after removing test-generated `content/texts.json`; no `.env`, WhatsApp auth/session, backup, subscription data, or temporary file was included in the source tree.

## Focused automated tests

- Bot feature, command routing/catalog/search, Anime, Music, downloader, and General Help suite: **107/107 passed**.
- Operational stability regression: **9/9 passed**.
- Website Command Explorer and Creative Studio regression: **5/5 passed**.
- Total focused tests: **121/121 passed**.

Menu-specific coverage includes:
- `.menu` sends the poster before the copyable text menu.
- `.fitur` sends the poster before the complete category index.
- Missing image file or failed media transport falls back to text.
- Custom-prefix installations skip the static dot-prefixed poster and keep correct text commands.
- Existing `.menu <category>`, `.commands`, `.help <command>`, search, and workflow paths remain intact.

## Release scope

- Added `assets/images/menu/pir_visuals_feature_menu.png`.
- Updated `features/commands/general-help.js` and its regression tests.
- Updated menu documentation and release metadata.
- No new npm dependency, MongoDB schema, collection, or index.
- Website package remains `3.50.0`; only the website health metadata reports bot platform `6.7.1`.

## Not yet verified on production-like staging

- Actual poster delivery and image rendering on WhatsApp Android, iOS, Desktop, private chat, and group chat.
- Image delivery behavior on slow connections or older WhatsApp clients.
- Full dependency-backed root and website test suites on the deployment host.
- Existing Pixel Realm-specific image menu/help flows after update.

Do not label this release Stable until the real WhatsApp staging checks pass.
