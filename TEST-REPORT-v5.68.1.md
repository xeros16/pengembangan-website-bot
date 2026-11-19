# PIR Visuals v5.68.1 — QA Report

## Passed

| Check | Result |
|---|---:|
| Website regression tests | 196 / 196 passed |
| Root JavaScript syntax scan | 173 files passed |
| `portfolio-website/server.js` syntax | Passed |
| `portfolio-website/models.js` syntax | Passed |
| Extracted `public-ui.js` syntax | Passed |
| CSS parse | 1,898 top-level nodes; no parse errors |
| Chromium console/page errors in representative fixture | 0 |
| Navigation header count | 1 at all tested widths |
| Horizontal overflow | None at 320, 360, 390, 400, 430, 768, 1024, and 1440 px |
| Mobile menu open/close | Passed |
| Mobile menu bounds | Inside viewport at all tested widths |
| Scroll state / progress | Passed |
| Reveal sequence after scrolling the page | 0 unrevealed targets remained (350px scroll steps, 160ms observer dwell) |
| Light Mode hero text | Computed color `rgb(32, 40, 32)` |
| Motion Off hero text | Computed opacity `1` |
| Motion Off project image curtain | Computed clip-path `none`; showcase curtain overlay `display:none` |
| Motion Off navigation | Computed animation `none` |
| OS reduced-motion | Ambient animation `none`; hero text opacity `1`; showcase curtain overlay `display:none` |
| Magnetic CTA | Bounded response; returns to `translate: 0px 0px` |
| Showcase image curtain | Reveals to `scaleX(0)`; disabled in Motion Off and reduced-motion |
| Dynamic story-grid insertion | New card inherits stagger index and avoids a duplicate generic reveal |
| Original archive inventory | 343 / 343 files retained |

## Root bot suite limitation

The root bot test suite was attempted, but the environment does not have the project's installed runtime dependencies. After a temporary test-only `node-fetch` shim, 350 of 356 tests passed; six import-time test failures remained because `mongoose` is not installed. The temporary shim and `node_modules` folder were removed and are not part of the release.

No bot command, game, database model, or WhatsApp integration source file was changed in this release.

## Browser QA scope

Chromium/Playwright ran against a representative page fixture containing the exact release CSS and extracted `public-ui.js`, with real viewport sizes and pointer interactions. This validates the shared motion/navigation system and its responsive behavior. It does not replace a final smoke test against the user's own live MongoDB records, uploads, email/WhatsApp credentials, and real production content.

## Preservation audit

Compared with the user-uploaded v5.67.0 ZIP:
- Original files deleted: **0**
- Original files retained: **343**
- New release files: **5**
- Existing files changed: **9**

No `.env`, local database, uploaded user files, or WhatsApp session files are included in the supplied v5.67.0 source archive or this release.
