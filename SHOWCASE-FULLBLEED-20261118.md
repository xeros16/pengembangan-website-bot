# PIR Visuals — Showcase Full-Bleed Media Update
Date: 2026-11-18

## Final changes
- Community Showcase carousel is now full-bleed edge-to-edge.
- The artwork column is intentionally larger than the editorial copy column.
- Media frame padding is removed so the artwork has maximum available space.
- Media border, white frame background, and decorative overlay labels are removed.
- The large decorative "PIR" watermark is removed.
- Portrait, landscape, and square media still use intrinsic aspect-ratio classification.
- Media remains `contain`-based, so the artwork itself is not cropped or stretched.
- Mobile keeps the copy-first / media-second flow and retains swipe, dots, arrows, autoplay, and keyboard support.
- PIR Visuals identity remains intact through the forest/sage palette and editorial typography.

## Important media note
The CSS no longer adds a white frame or padding around uploaded artwork. Any white area that is genuinely part of the uploaded artwork file is intentionally preserved so the artwork is not altered or cropped.

## Verification
- `npm run check` — PASS
- `tests/showcase-editorial-pir-identity-20261118.test.js` — PASS (3/3)
- `tests/showcase-media-fit-v20261118.test.js` — PASS (2/2)
- `tests/showcase-fullbleed-media-v20261118.test.js` — PASS (3/3)

Browser rendering could not be run in this environment because the local project dependencies required by `server.js` (notably `sharp`) are not installed here.
