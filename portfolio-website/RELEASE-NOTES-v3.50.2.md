# PIR Visuals — v3.50.2

## Layout fixes
- `/collections`: removed the inherited 32px gap after the dark page intro so the full-width Moodboard stage connects directly to it.
- `/categories`: removed the top inset below the navigation and made the “Find your creative language” masthead full viewport width.
- Kept the category discipline tiles and latest-work content on the existing readable content grid.
- Bumped the public polish stylesheet URL to `20261116ay` to prevent stale browser CSS.

## Verification
- 21 focused layout regression tests passed.
- `node --check server.js` passed.
