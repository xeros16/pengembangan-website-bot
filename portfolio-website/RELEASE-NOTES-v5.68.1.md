# PIR Visuals v5.68.1 — Motion Refinement & Design Polish

## Source baseline

Built directly from the user-uploaded `PIR-Visuals-v5.67.0-Mobile-Button-Alignment-Refinement.zip`. This release does not import the earlier v5.68.0 package. The supplied v5.67.0 file inventory is preserved: no original file was deleted.

## Intent

Keep the motion language that was already working, then make it feel more controlled and fluid. This is a refinement release, not a replacement of the existing design system.

## Motion and performance changes

### Smoother scroll response
- One passive scroll listener and one `requestAnimationFrame` scheduler now drive the progress line, sticky navigation state, back-to-top visibility, and homepage hero parallax.
- Scroll progress uses `transform: scaleX()` rather than repeatedly changing width.
- Hero pointer lighting and card spotlight writes are throttled to one animation frame.
- Image and page-transition motion no longer use blur filters.
- Homepage category and manifesto hover effects no longer animate padding or other layout properties.
- The editorial ribbon is slightly slower and the hero parallax travel is more restrained.

### Navigation stability
- Removed the independent navbar entrance animation so it cannot stack with the page transition.
- The one shared navigation header receives a persistent View Transition name.
- The navigation snapshot stays static during cross-document transitions; page content uses a short opacity/translate transition.
- Added a subtle scroll-state surface, active-link underline, dropdown chevron feedback, and menu icon response.
- The existing mobile menu markup, button dimensions, and responsive layout are retained.

### Reveal choreography
- Reveal targets are filtered so a parent and its nested card are not animated at the same time.
- Homepage story grids own their own stagger sequence; their direct children are removed from the generic reveal observer.
- Stagger timing is calculated per sibling group, not by one page-wide index.
- Reveal targets now have lightweight content, card, panel, and media motion variants.
- Added reveal coverage for category tiles, showcase headings, profile hero surfaces, and studio content headings.

### New micro-interactions
- Portfolio images settle from a small scale into their final crop, with a transform-only curtain wipe that reveals the image after the card enters.
- Category artwork receives a restrained lift and rotation on fine-pointer devices.
- CTA arrow glyphs nudge slightly on hover.
- Primary CTA buttons receive a bounded magnetic response on precise-pointer devices only.
- Navigation links gain a short active/hover underline.
- Dropdown chevrons and menu icons rotate with the same easing family.
- The ambient background ring drifts slowly without moving page content.

## Motion Off and accessibility
- Fixed homepage hero words that could remain transparent when Motion Off disables their keyframe animation.
- Fixed homepage project image curtains that could remain clipped when Motion Off disables transitions.
- Motion Off clears magnetic offsets and pointer spotlight classes so re-enabling motion does not cause a jump.
- Motion Off also suppresses decorative hover transforms.
- `prefers-reduced-motion` disables the ambient background, view-transition motion, magnetic translation, and new hover movement.
- Native scrolling remains in place; no scroll-jacking library or animation framework was added.

## Design system preservation
- PIR's forest-green, sage, warm-ivory and pear identity remains intact.
- Existing category-specific color palettes and Light/Dark semantic tokens remain unchanged.
- No global forced radius, typography, color, or background override was introduced.
- Existing mobile button alignment from v5.67.0 is retained.

## Reference research

The interaction principles were reviewed against:
- Bettr Academy — the user's supplied visual reference for editorial hierarchy and section storytelling.
- Studio Freight — art direction and a consistent visual language across an experience.
- Active Theory — expressive navigation and interactive details; the implementation here intentionally stays much lighter and does not add WebGL.
- Locomotive — digital-first composition and the relationship between design and implementation.
- GSAP ScrollTrigger — viewport-triggered choreography and frame-synchronized scroll updates; PIR keeps its native IntersectionObserver/RAF approach rather than adding GSAP.
- web.dev — high-performance CSS animation guidance; prefer `transform` and `opacity`, avoid layout/paint-heavy properties, and use `will-change` sparingly.
- MDN View Transition API — persistent named elements across same-origin multi-page navigation.
- MDN and W3C reduced-motion guidance — keep essential content visible and allow decorative motion to be disabled.
- Lenis documentation — reviewed as a smooth-scroll reference, but not installed because native scrolling is already preferable for this project.

## Version and cache
- Root platform version: `5.68.1`
- Website package version: `3.22.0`
- Public service-worker cache: `pir-visuals-public-v14`
- Icon cache-busting token: `5681`

## Validation results

- Website regression tests: **196/196 passed**.
- Root JavaScript syntax scan: **173 files passed**.
- Website server and model syntax: passed.
- Extracted `public-ui.js` syntax: passed.
- CSS parser: passed with no parse errors.
- Chromium/Playwright representative homepage smoke: passed for desktop, mobile, Light Mode, Dark Mode, Motion Off, and system reduced motion.
- Responsive viewport smoke: **320, 360, 390, 400, 430, 768, 1024, and 1440 px**; no horizontal overflow and one navigation header at every tested width.
- Mobile menu: opens and closes; measured panel stays inside viewport bounds.
- Motion Off: hero headline opacity is `1`, project image clip-path is `none`, and navigation animation is `none`.
- Reveal smoke after scrolling through the representative page: no reveal/story targets remained hidden.
- Browser console/page errors in the representative smoke: **0**.

### Environment limitations
- The representative browser fixture validates the shared website CSS and `public-ui.js`, but does not replace testing against the user's own live MongoDB records, uploads, WhatsApp session, or third-party credentials.
- The full root bot test suite could not be completed in this environment because the project runtime dependencies (including `mongoose`) were not installed; the bot source files themselves were not changed.
- Before deployment, preserve the local `.env`, database, uploads, and WhatsApp session.

## Files changed

- Root `package.json` and `package-lock.json` version metadata.
- `portfolio-website/package.json` version metadata.
- `portfolio-website/server.js` motion, reveal, navigation, scroll scheduling, and PWA cache.
- `portfolio-website/README.md`.
- Four existing website test files with current release/cache assertions.
- New `portfolio-website/tests/motion-refinement-v5.68.1.test.js`.
- Root and website release notes.
- Motion reference documentation.
