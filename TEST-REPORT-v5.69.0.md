# PIR Visuals v5.69.0 — QA Report

## Automated checks

| Check | Result |
|---|---:|
| Website regression tests | 205 passed / 0 failed |
| Root JavaScript syntax scan | 173 files passed |
| Website server + models syntax | Passed |
| Extracted `public-ui.js` syntax | Passed |
| CSS parsing | 2,393 rules; 6,979 declarations; 0 errors |
| Chromium console/page errors | 0 |

## Browser behavior checks

The shared website CSS and actual extracted public UI script were exercised in Chromium through a representative page fixture.

| Scenario | Result |
|---|---|
| Single navigation header | 1 header at every tested width |
| Responsive width matrix | 320, 360, 390, 414, 430, 768, 1024, 1280, 1440px; no horizontal overflow |
| Mobile menu | Opens, closes, and stays within viewport |
| Desktop image depth | Pointer tilt activates and resets on pointer leave |
| Light Mode | Heading remains visible; theme-aware foreground color resolves |
| Mobile filter disclosure | Collapses by default, opens on request, updates active count |
| No-JavaScript filter fallback | Toggle hidden; all advanced filters remain visible |
| Motion Off | No hidden reveal targets; navbar animation is `none` |
| System reduced motion | No hidden reveal targets; ambient animation is `none`; depth motion not initialized |
| Scroll through representative page | No reveal targets remain hidden |

## Test implementation notes

- The browser fixture uses the actual `<style>` content from `pageShell()` and the actual JavaScript served as `public-ui.js`.
- It includes representative home, directory, category, portfolio case-study, studio, navigation, and command-dialog surfaces.
- The fixture uses local SVG data for visual test imagery and does not require network access.
- Responsive matrix is checked at the viewport widths listed above.

## Root bot test limitation

The full root test suite was attempted. **350 tests passed; 6 test files could not load** because the isolated environment does not have the project runtime dependencies `node-fetch` and `mongoose` installed. The failing files report `ERR_MODULE_NOT_FOUND`; these are module-load/environment issues, not test assertion failures. The root syntax scan still passed all 173 JavaScript files. No bot/game/backend source file was modified by v5.69.0.

## Not covered

- Live MongoDB connection and persisted account/portfolio records.
- WhatsApp/Baileys runtime session and OTP flows.
- Production SMTP, external image uploads, and deployment environment.
- Device-specific performance on the user's actual phone and desktop hardware.

The release is suitable for staged local installation and visual review, but should not be described as live-production integration tested.
