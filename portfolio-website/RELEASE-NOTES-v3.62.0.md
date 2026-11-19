# PIR Visuals Website — Release Notes v3.62.0

## Design direction

This update translates two supplied references into an original PIR Visuals treatment:
- BETTR Academy: stronger editorial hero, clearer audience pathways, storytelling sequence, social proof and conversion hierarchy.
- The Rewilding Co.: warm botanical/earthy palette, image-led collection presentation, tidy filters and scannable profile cards.

## Changes

- Moved the three user-journey cards directly after the hero and motion ribbon so visitors can choose a path earlier.
- Added a reference-blend stylesheet with warm paper, forest, sage, clay and restrained ochre tokens.
- Refined desktop hero hierarchy and live directory panel.
- Refined the homepage showcase, category cards, talent cards, selected work, manifesto, CTA, FAQ and testimonial surfaces.
- Restyled the desktop designer directory with a sticky collection-style filter column and a two/three-column profile grid; tablet/mobile retain the existing compact filter flow.
- Preserved existing copy, routes, data, profile/portfolio interactions, and PIR brand identity.
- Added reduced-motion safeguards.

## Files

- `server.js`
- `pir-reference-blend-v3.62.css`
- `package.json` / `package-lock.json`
- `tests/reference-blend-v3.62.test.js`

## Validation

Run `npm run check` and `node --test tests/reference-blend-v3.62.test.js`.
