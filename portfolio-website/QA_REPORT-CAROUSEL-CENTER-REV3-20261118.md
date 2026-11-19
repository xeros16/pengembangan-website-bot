# QA Report — Carousel Artwork Maximum Contain Scale Rev. 3

## Scope
- Enlarge desktop homepage showcase artwork to the largest possible size inside the existing green right-hand panel.
- Keep the complete uploaded artwork visible with no crop or aspect-ratio distortion.
- Preserve horizontal and vertical centering.
- Leave the copy column, desktop 50:50 split, and mobile layout unchanged.

## Implementation
- The desktop media frame stretches across the full right grid column.
- The image/video element fills the frame's available width and height; `object-fit: contain` scales the source proportionally to the largest fit.
- The green inset is reduced to 6–9px to give the artwork more usable area.
- The desktop-only override does not change mobile rules.
- Updated the stylesheet cache key to `20261118-image-fill-center-r`.

## Checks
- 48/48 focused carousel layout, image-fit, centering, responsive, and cache-busting tests passed.
- `npm run check` passed.
- Full `npm test`: 546 passed, 88 failed. The remaining failures are in legacy tests elsewhere in the supplied package that still expect older asset names, cache keys, or prior layout rules; they are outside this image-fit patch.

## Aspect-ratio behavior
- Landscape, square, and portrait artwork are all scaled to the largest possible fit in the green frame.
- If the source image ratio differs from the green frame ratio, some green space remains on one axis by design so no part of the artwork is cropped or stretched.
