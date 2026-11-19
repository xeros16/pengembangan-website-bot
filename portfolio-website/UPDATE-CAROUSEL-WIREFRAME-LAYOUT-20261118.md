# PIR Visuals — Carousel Wireframe Layout

Website-only update.

## Layout changes
- The carousel heading and intro copy now sit in one centered, full-width top band.
- The slide retains its left text / right artwork split.
- The left text cell receives a subtle PIR-green outline.
- The counter, pagination dots, and previous/next arrows sit in one full-width footer band.
- The mobile layout keeps its existing stacked text-then-image behavior.

## Explicitly unchanged
- The right-hand artwork/media column and its sizing rules.
- Image/video source files, intrinsic ratio, object-fit, and crop behavior.
- Mobile full-width image behavior.
- Bot files and bot configuration.

## Validation
- Added `tests/showcase-wireframe-layout-20261118.test.js` to check the new layout rules and guard the right-hand media styles from being changed by this update.
