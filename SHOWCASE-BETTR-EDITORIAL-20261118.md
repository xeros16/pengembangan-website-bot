# PIR Visuals — Showcase Editorial Revision
Date: 2026-11-18

## Direction
The homepage Community Showcase carousel has been redesigned using the composition principles visible in the supplied Bettr Academy reference:
- bold editorial headline
- strong split composition
- large media as the visual anchor
- warm, expressive color blocking
- restrained but visible decorative details
- compact metadata and a clear CTA
- carousel navigation remains explicit and accessible

This is an original PIR Visuals treatment. No Bettr Academy assets, copy, logo, or brand identity were copied.

## Carousel changes
1. The showcase is no longer presented as a generic rounded container.
2. Desktop uses a two-panel editorial composition: information on the left, artwork on the right.
3. The left panel uses category-specific warm accent surfaces; the right panel uses a dark PIR forest media stage.
4. Oversized slide numbering, circular geometry, micro labels, and arrow details add visual character without becoming decorative noise.
5. Tabs are treated as an editorial navigation rail rather than pill-heavy UI.
6. The existing carousel behavior remains: category tabs, previous/next controls, dots, keyboard navigation, touch swipe, autoplay pause on hover/focus, and reduced-motion support.
7. Media is classified from intrinsic dimensions into portrait, landscape, or square so uploaded artwork can use the available panel intelligently without cropping or stretching.
8. Mobile stacks the editorial copy above the artwork and keeps controls compact.

## Files changed
- `portfolio-website/pir-showcase-bettr-editorial.css`
- `portfolio-website/pir-home-showcase.js`
- `portfolio-website/server.js`
- `portfolio-website/tests/showcase-editorial-bettr-20261118.test.js`

## QA
- `node --check server.js` — PASS
- `node --check pir-home-showcase.js` — PASS
- showcase editorial regression — 3/3 PASS
- media-fit regression — 2/2 PASS
- homepage carousel regression — 5/5 PASS
- featured-card regression — 1/1 PASS

The complete historical test suite still contains unrelated legacy failures in the source package; those were not used as a release gate for this focused carousel change.
