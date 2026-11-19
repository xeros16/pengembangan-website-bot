# PIR Visuals v5.70.0 — QA Report

## Automated regression

- **212/212 website tests passed** using Node's built-in test runner.
- **387/387 root tests passed** using the project dependency set.
- **173 JavaScript files passed** the repository syntax scanner.
- `portfolio-website/server.js`, `portfolio-website/models.js`, and the public UI script passed `node --check`.
- The inline website stylesheet parsed successfully with PostCSS: **2,565 rules, 7,545 declarations, 0 parse errors**.
- No runtime dependency was added.

## Browser verification

Representative fixtures were assembled from the actual server stylesheet, public UI script, and brand icon, then exercised in Chromium with Playwright.

- Browser/page errors: **0**.
- Broken images in the fixture: **0**; the PIR brand emblem loaded successfully.
- Exactly one top-level site navigation header at every tested viewport; the mobile menu also closes when a user taps outside it.
- No horizontal overflow at **320, 360, 390, 414, 430, 768, 1024, 1280, and 1440px**.
- Collection live preview updates title, description, and deduplicated ID counts.
- Move controls work with keyboard activation (Enter) and update the existing `itemIds` input in the same order as the visible cards.
- Removing a work updates the input, announces the change, and moves keyboard focus to the next enabled control.
- Drag-and-drop updates the order and emits one completion announcement.
- Public collection share path is canonical (`/collections/:slug`) and excludes the private edit query key.
- Case-study chapter navigation and Designer Studio section navigation select the expected active anchor.
- Motion Off sets the new transitions to `0s` while keeping content and controls available.
- System reduced-motion preference sets nonessential transitions to `0s`.
- Without JavaScript, the manual collection ID field remains visible and the enhanced sorter remains hidden.

## Theme contrast check

The collection-create primary action was checked against both accent tokens in both themes. Values are WCAG contrast ratios calculated from rendered foreground and theme token colors.

| Theme | Foreground | Against stronger accent | Against accent |
|---|---|---:|---:|
| Light | `rgb(255, 255, 255)` | 9.52:1 | 5.87:1 |
| Dark | `rgb(32, 40, 32)` | 10.39:1 | 7.30:1 |

The collection-cover title and description use explicit white text over a dark overlay in both themes. New helper copy uses the semantic muted text token.

## Source and archive integrity

- The v5.69.0 source archive was copied as the direct base.
- No original archive file was deleted.
- No database model or schema was changed.
- Bot, WhatsApp, Game Center, authentication, upload, moderation, and Client Workspace source files were not modified.
- Root and website package versions are **5.70.0** and **3.24.0**.
- Service-worker cache and icon token were advanced to avoid stale public assets.
- QA fixtures, screenshots, and temporary `node_modules` links are excluded from the release ZIP.

## Environment limitations

- This QA run did not connect to the user's MongoDB database, SMTP provider, or WhatsApp/Baileys session.
- Collection ordering was browser-tested against the existing form contract and unit/source-tested; persistence must still be confirmed against the user's MongoDB instance after installation.
- Browser QA used representative fixtures assembled from the shipped CSS and public UI JavaScript. It is not a live production account/session test.

## Visual QA artifacts

Screenshots were captured for the desktop Light/Dark themes, Collection builder/detail, case-study navigation, Designer Studio setup, and mobile Motion Off. They are stored outside the release ZIP so the archive contains only the project and documentation.
