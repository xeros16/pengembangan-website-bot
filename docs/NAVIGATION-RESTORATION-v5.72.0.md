# Navigation Restoration — v5.72.0

## Root cause found

The Lainnya menu is a native HTML `<details>` disclosure. Its submenu had a component rule setting `display:grid`. Because that author rule overrode the browser's default hidden styling for descendants of a closed `<details>`, the submenu remained rendered even when Lainnya looked closed.

That caused the secondary links to sit over or compete with the utility row containing Portal desainer, Cari, Motion, and Tema. At compact widths, the extra content also made the menu feel crowded and could push controls outside the visible panel.

## Repair

- Explicitly set `.nav-more:not([open]) > .nav-more-menu { display:none }`.
- Show the submenu only for `.nav-more[open]`.
- Preserve absolute positioning of the compact navigation panel; do not turn it into a flex child of the header.
- Keep the menu bounded by viewport height with internal vertical scrolling.
- Keep submenu links in a two-column grid on compact layouts.
- Use one navigation controller for open/close state, outside click, link selection, Escape, and focus restoration.
- Synchronize `aria-expanded` on the Lainnya summary.
- Raise the header stacking layer without adding a second navbar or another entrance animation.

## Added destinations

- `/client` — Ruang klien.
- `/contact` — Contact & support.

## QA

Chromium interaction QA covered 320×600, 360×700, 390×844, 400×497, 430×932, 768×900, 1024×768, 1180×820, 1280×900, and 1440×900.

Verified:
- Closed submenu is absent from layout and hit testing.
- Portal, Cari, Motion, and Tema receive pointer hits on compact layouts.
- Expanded submenu does not overlap the utility row.
- Desktop dropdown does not overlap the utility actions.
- No horizontal overflow.
- `aria-expanded` tracks disclosure state.
- Escape closes the disclosure and returns focus to its summary; a second Escape closes the compact menu and returns focus to the toggle.
- Selecting a navigation link closes the compact panel.
- Theme button changes theme.
- Zero page errors and zero console errors in the fixture.

Contrast checks for the four navigation actions are above WCAG AA for normal text in both themes. See `docs/qa/NAVIGATION-RESULTS-v5.72.0.json` for the recorded interaction results.

## Contrast

Chromium computed-color measurements exceed WCAG AA for normal text in both themes:

| Control | Dark | Light |
|---|---:|---:|
| Portal desainer | 10.15:1 | 10.15:1 |
| Cari | 10.90:1 | 8.11:1 |
| Motion | 10.90:1 | 9.97:1 |
| Tema | 10.90:1 | 9.64:1 |

See `docs/qa/NAVIGATION-CONTRAST-v5.72.0.json` for computed colors and ratios.
