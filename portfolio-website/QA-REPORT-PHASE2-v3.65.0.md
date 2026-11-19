# PIR VISUALS — Phase 2 Functional QA

**Website update:** v3.65.0  
**QA focus:** Discover / Jelajahi, directory filtering, selected-work explorer, favorites, shortlist, quick view, responsive navigation.

## Issues found and fixed

1. **Discover filter rail overlapped Selected Work while scrolling.** The filter rail was sticky inside the entire discovery stage, so it could remain above the next full-width section. The page now groups the filter rail and directory results in `.pv-directory-layout`; the sticky rail is bounded by that wrapper and stops before Selected Work. On tablet/mobile it returns to normal document flow.
2. **Selected-work category/search filters updated the count but did not hide unmatched cards.** The native `hidden` attribute was being overridden by the card display rule. The new stylesheet explicitly applies `display: none !important` to hidden selected-work cards.

## Functional checks completed

- Directory query parsing, combined filters, verification/availability flags, budget overlap, invalid budget handling, fit scoring, sorting, and pagination: **33 focused tests passed** across the v3.65 regression, directory-quality, and matchmaking suites.
- Browser interaction checks with isolated mock profile/work data:
  - Desktop 1365px: no horizontal overflow; 320px filter rail + flexible result column.
  - Sticky filter rail does not geometrically overlap the Selected Work section.
  - Mobile 390px: no horizontal overflow; filter rail is non-sticky; directory cards collapse to one column.
  - Category chip and text search each reduce the visible selected-work cards from 3 to 1 and update the live result count.
  - Favorite state restores from browser storage and toggles on/off.
  - Shortlist state restores and accepts an additional designer.
  - Designer quick-view dialog opens.
  - Discover GET filter form serializes the selected search, skill, and sort criteria.
  - Mobile navigation opens and closes with Escape.
- Mocked HTTP route smoke checks: **9/9 returned HTTP 200** for `/discover`, search Discover, guided-fit Discover, `/for-business`, `/commands`, `/studio`, `/favorites`, `/shortlist`, and the new CSS asset. The Discover route checks used stubbed model data, not the live database.
- `npm run website:check`: passed.
- New CSS parsed with **0 parse errors**.

## Full-suite status

The full historical website suite currently reports **682 passed / 790 total / 108 failed** when run through the root `website:test` script. This is not a clean full regression result. The remaining failures include older release/cache-version assertions and historical layout/interaction expectations; they have not been represented as passing. The focused Phase 2 suites listed above are green.

## Not covered by isolated QA

- Live MongoDB data, production indexes, and real designer accounts.
- Email delivery, WhatsApp OTP delivery, password reset email, and external messaging integrations.
- Authenticated Designer Studio mutations against the live database.
- Production deployment, HTTPS, and service-worker behavior in the user's browser.

These require the user's configured services and a safe test account; no real email or WhatsApp messages were sent during this QA.
