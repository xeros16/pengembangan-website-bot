# Showcase Media Fit Fix — 18 Nov 2026

## Based on
The previous **PIR Visuals Agency Redesign** package, not the Forest Editorial variant.

## What changed
- Reverted the Forest Editorial theme changes.
- Updated the homepage showcase media frame so the wrapper follows the artwork/video's intrinsic ratio.
- Removed the fixed 16:10 media box that created excessive empty space around portrait artwork.
- Images and videos now use `width/height: auto` with responsive max dimensions and `object-fit: contain`, so the full artwork stays visible at browser zoom/zoom-out.
- Responsive max-height rules are applied at 1024px, 768px and 480px.
- Added a focused regression test for the media-fit behavior.
- Bumped the agency stylesheet cache version to `20261118c`.

## QA
- `node --check server.js` — PASS
- `node --check pir-home-showcase.js` — PASS
- All 111 JavaScript files in `portfolio-website` — syntax check PASS
- `node --test tests/showcase-media-fit-v20261118.test.js` — PASS (2/2)

## Expected visual result
Landscape work can remain wide while portrait work no longer sits inside a large empty 16:10 rectangle. The media area shrinks to the artwork, while the two-column editorial layout remains intact. No cropping is introduced.
