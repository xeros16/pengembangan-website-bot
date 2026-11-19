# QA Report — PIR Visuals v5.81.0

## Release scope
Universal top navigation behavior and responsive hardening. No database schema, authentication, WhatsApp bot, media, or business-route logic was changed.

## Automated checks
- `npm run website:check`: PASS
- `npm run website:test`: 313 passed, 0 failed
- `npm run check`: PASS — 182 JavaScript files syntax-checked
- Extracted `public-ui.js` syntax check: PASS
- Browser console/page errors in navigation fixture: 0

## Browser interaction checks
Browser QA used the actual `pageShell` CSS, navigation markup, and `public-ui.js` extracted from `portfolio-website/server.js`, assembled in an isolated fixture.

Tested viewport sizes:
- 320×480
- 320×568
- 360×568
- 390×667
- 414×844
- 430×844
- 600×600
- 768×844
- 850×844
- 1024×768
- 1180×820
- 1181×820
- 1280×800
- 1440×900

Results:
- No horizontal overflow at tested widths.
- Compact menu opens within viewport bounds, including 320×480.
- Closed compact menu is inert and aria-hidden.
- Desktop navigation remains visible; compact toggle is hidden above 1180px.
- Escape closes nested disclosure before closing the compact menu.
- Escape returns focus to the menu toggle.
- Outside click closes the compact menu.
- Resizing from compact to desktop and back synchronizes open/inert/aria-hidden state.
- Theme switching preserves readable navigation text.
- Quick command palette closes the compact menu and restores focus on close.
- No-JavaScript fallback displays navigation links and hides the compact menu toggle.

Measured navigation text contrast in browser:
- Light panel/link: 10.94:1
- Light toggle: 12.75:1
- Dark panel/link: 12.35:1
- Dark toggle: 11.11:1

## Full project checks
- `npm test`: 397 passed, 10 failed out of 407.
- The 10 failures are in bot/backup test expectations (`backup-hardening`, `bot-health-endpoint`, `designer-profile`, and `portfolio-website-integration` test groups). Those bot/backup source files were not changed in this website update.
- `npm run check` passed.

## Environment limitation
The live portfolio HTTP server could not be booted in this QA container because the installed `sharp` package is missing its Linux x64 native runtime. Browser checks therefore validated the real navigation CSS/markup/client script extracted from the server source, not a database-backed live HTTP session. Install the project's optional native `sharp` dependency on the target machine before running the full server smoke test.

## Protected files
`portfolio-website/models.js`, `.env`, database content, uploads/media, and WhatsApp session folders are not included in the update archives.
