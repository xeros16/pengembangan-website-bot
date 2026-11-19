# PIR Visuals — Community Showcase Carousel Editorial Revision
Date: 2026-11-18

## What changed
- Reworked the homepage Community Showcase into a cleaner editorial split layout.
- Removed the heavy enclosing card treatment around the whole carousel.
- Kept category tabs as a compact filter rail with a stronger active state.
- Increased typographic hierarchy for the showcase title and active work title.
- Added a small slide index for clearer editorial navigation.
- Improved the relationship between artwork, metadata, creator attribution and CTA.
- Kept uploaded artwork at its intrinsic aspect ratio; no forced 16:10 frame.
- Media can scale up to the available height/width without cropping.
- Tightened spacing so portrait artwork does not sit inside an oversized empty frame.
- Preserved keyboard tab navigation, touch swipe, dots, arrows, autoplay pause-on-hover/focus, and reduced-motion support.
- Bumped the public-polish stylesheet cache version to ensure the new CSS is picked up.

## Design reference
Bettr Academy was used as a quality reference for:
- bold editorial typography;
- clear user pathways and category grouping;
- strong visual hierarchy;
- curated content presentation;
- concise metadata and action placement.

The implementation does not copy Bettr Academy's assets, branding, copy, or pixel layout.

## QA
Targeted carousel/media tests: 11/11 passed.
JavaScript syntax checks for `server.js` and `pir-home-showcase.js`: passed.

A local Chromium headless screenshot attempt was blocked by the environment's unavailable GPU process, so no live-browser screenshot claim is made. The CSS/markup regression suite was run successfully.
