# PIR Visuals — Carousel Full-Bleed Correction

Website-only revision based on the clarified screenshot markup.

## Corrected behavior
- Existing showcase masthead and category tabs are preserved without a new white card, border, or decorative outline.
- Only the carousel panels break out of the centered page wrapper and span the full viewport width.
- Desktop carousel remains a 50:50 split: text on the left, image on the right.
- Text stays left-aligned and vertically centered in its column, with no added border or box.
- Existing forest-green image backing, image ratio, object-fit, object-position, and crop behavior are not changed.
- Carousel controls occupy the full-width rail below the slide.
- Mobile keeps the stacked text-then-image layout and existing full-width media behavior.

## Files changed
- `pir-showcase-editorial.css`
- `tests/showcase-wireframe-layout-20261118.test.js`
- `server.js` stylesheet cache version
