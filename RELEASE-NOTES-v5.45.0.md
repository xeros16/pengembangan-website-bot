# PIR Visuals v5.45.0 — Discovery & Portfolio Experience

## Portfolio
- Masonry-style portfolio showcase with varied image ratios.
- Accessible fullscreen image lightbox using native dialog, close button, backdrop click and Escape key.
- Responsive mobile single-column presentation.
- Respects reduced-motion preferences.

## Discovery
- Added popular category shortcuts to speed up designer discovery.
- Existing keyword, skill, category, location, price, verified, featured, availability and sorting filters remain available.

## Performance
- Portfolio media endpoint negotiates WebP when supported by the browser.
- Sharp resizes optimized media to a maximum 1800px edge and quality 82.
- Original JPEG/PNG/WebP delivery remains as fallback.
- Cache lifetime extended with Vary: Accept.

## SEO
- Sitemap now includes approved case-study URLs belonging to public designers, in addition to static and public designer profile URLs.

## Compatibility
- No database schema migration.
- Existing image upload, portfolio moderation, analytics, favorites, Baileys and game modules are preserved.
- Media is transformed at response time; source upload files are not modified.

## Validation
- Website syntax check and website tests run for this release.
- Bot syntax and test suite run for this release.
