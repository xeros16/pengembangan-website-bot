# PIR Visuals — Community Showcase Editorial Identity

Date: 2026-11-18

## Current direction

The homepage Community Showcase is an editorial split carousel inspired by PIR Visuals' own design language, not an external brand.

### Identity
- Deep forest: `#20372A`
- Deep forest secondary: `#14291D`
- Sage: `#C7DAAF`
- Light sage/ivory: `#F0F3EB`
- Paper: `#FBFCF7`
- Serif editorial headlines with the existing PIR Visuals typography system.
- Strong forest CTA and navigation accents.

### Carousel composition
- Copy on the left, artwork/media on the right.
- Large editorial headline and compact metadata.
- Subtle PIR Visuals index, line and circular ornaments so the section is not visually flat.
- Category navigation remains a clean editorial rail.
- Counter, dots and previous/next controls remain accessible.
- Hover, keyboard, swipe and autoplay behavior are retained.
- Reduced-motion behavior remains supported.

### Media behavior
- Images/videos are classified by intrinsic ratio in `pir-home-showcase.js`.
- Portrait, landscape and square assets use `object-fit: contain`.
- No forced 16:10 frame.
- The media panel uses the available height/width efficiently while preserving the uploaded artwork.

### Production files
- `portfolio-website/pir-showcase-editorial.css`
- `portfolio-website/pir-home-showcase.js`
- `portfolio-website/server.js`
- `portfolio-website/tests/showcase-editorial-pir-identity-20261118.test.js`

The production stylesheet is loaded after `pir-agency-system.css` so the showcase identity pass cleanly overrides the earlier agency layout rules.
