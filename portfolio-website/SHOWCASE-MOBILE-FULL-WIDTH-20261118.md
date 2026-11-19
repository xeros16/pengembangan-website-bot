# Showcase mobile full-width artwork — 18 November 2026

- Mobile/tablet showcase artwork now fills the complete available media column width.
- Removed portrait/square width caps and viewport-height caps that made the image appear smaller than the available width.
- Image height follows its intrinsic aspect ratio; `object-fit: contain` remains in place to prevent cropping or stretching.
- Mobile artwork wrapper stays transparent with zero padding, so the green backing remains removed.
- Desktop layout and styling are unchanged.
- Cache-busting query updated for `pir-showcase-editorial.css`.

Validation:
- New mobile full-width regression test: PASS.
- JavaScript syntax checks: PASS.
- Full legacy suite baseline: 73 pre-existing failures in both the previous ZIP (594 tests) and revised ZIP (595 tests); the revised ZIP adds one passing regression test.
