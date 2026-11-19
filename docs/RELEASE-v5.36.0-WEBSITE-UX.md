# PIR Visuals v5.36.0 — Website UX Guide

## New public navigation
- `Jelajahi`: public designer directory.
- `Favorit`: locally saved designers in this browser.
- `Login Designer`: opens Designer Studio at `/studio`.

## Search and filters
Use search for a designer name, bio, skill or location. Optional filters:
- Skill and location
- Verified only
- Featured only
- Accepting new projects
- Minimum and maximum starting price
- Sort by recommended, name, lowest price or highest price

Choose **Reset** to clear filters.

## Favorites
Press **♡ Favorit** on a designer card or portfolio page. Open `/favorites` to see saved designers. Favorites use browser local storage, so they are device/browser-specific and are not synced between devices. Clearing browser site data also clears favorites.

## Designer analytics
Public portfolio insights show profile views, portfolio previews and contact clicks. Designer Studio continues to provide the private designer analytics summary. Public figures are aggregate engagement counts, not client identities.

## Designer login
Use the top navigation **Login Designer** or open `/studio`. The existing email reset route `/studio/forgot` remains unchanged.

## Windows update
1. Back up current source and both environment files.
2. Stop only the portfolio website process.
3. Extract the new release to a new folder and copy `portfolio-website/.env`.
4. Run `npm install` in `portfolio-website`.
5. Start the website and check `/health`, `/`, `/favorites`, `/studio` and one public designer profile.
6. Test favorites on a phone and desktop separately; favorites are intentionally local to each browser.
