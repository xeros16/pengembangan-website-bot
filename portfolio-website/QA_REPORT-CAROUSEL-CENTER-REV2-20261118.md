# QA Report — Carousel Artwork Centering Rev. 2

## Scope
- Restore the homepage showcase image to its natural size whenever it fits inside the right green panel.
- Keep the image centered horizontally and vertically within that panel.
- Preserve intrinsic aspect ratio and avoid cropping/stretching.
- Leave the left copy column and mobile-specific layout unchanged.

## Checks
- 18/18 targeted showcase-centering, natural-ratio, compact-panel, and cache-busting tests passed.
- `npm run check` passed (JavaScript syntax checks).

## Implementation
- Removed the restrictive desktop 560px image-width cap.
- Set image max-width to the available green-panel inner width; kept a generous viewport-relative height guard for tall artwork.
- Reduced the green inset to 10–12px so the reference landscape artwork can render at its natural 643px width at the supplied desktop viewport.
- Updated the stylesheet cache key to `20261118-image-center-q`.
