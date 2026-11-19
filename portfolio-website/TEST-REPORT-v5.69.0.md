# PIR Visuals v5.69.0 — Immersive Motion & UI/UX Evolution

## Source baseline

Built from the v5.68.1 package that was derived from the user-uploaded `PIR-Visuals-v5.67.0-Mobile-Button-Alignment-Refinement.zip`. Existing v5.68.1 behavior and project files are retained. No bot/game/backend source file was changed in this release.

## Direction

The selected direction is **immersive motion + hybrid editorial/interactive visual design + all website areas**. This is a layered evolution of the existing PIR identity, not a redesign that replaces the forest-green, sage, warm-ivory, pear emblem, theme tokens, or mobile navigation.

## What's new

### Motion system

- Adds semantic reveal variants for headings, media, cards, panels, and supporting content.
- Extends reveal coverage to category introductions and indexes, category recent-work cards, designer showcase jump navigation and facts, case-study sections, related projects, support success states, shortlist tools, FAQ items, and selected Designer Studio surfaces.
- Adds a bounded 3D media-frame tilt on precise-pointer devices for portfolio images, homepage project images, category artwork, related-work images, case-study covers, and designer portraits.
- The pointer tilt updates through one `requestAnimationFrame` scheduler, is capped to a small rotation, and resets when the pointer leaves the media frame.
- Adds short dialog, FAQ, and toast entrance feedback using transform/opacity rather than layout-changing animation.
- Preserves the existing persistent single navbar and existing View Transition behavior; no second navbar entrance animation or extra header was introduced.

### UI/UX

- The Discover page keeps keyword search immediately visible on mobile and places advanced filters in an accessible disclosure.
- The filter toggle exposes `aria-expanded` and `aria-controls`, displays an active-filter count, and updates as users edit fields.
- On narrow screens, filters use a compact two-column arrangement where space permits and a single column at 360px and below.
- When JavaScript is unavailable, the filter disclosure control stays hidden and all filters remain visible, so search remains usable.
- Submit feedback is visual only; the submit control is not disabled before the browser serializes the GET form.
- Focus rings, form focus feedback, and active button feedback are clearer and consistent.

### Motion safety and performance

- Motion Off immediately clears the new media-tilt state and leaves all reveal content visible.
- `prefers-reduced-motion` disables the new pointer depth, toast/dialog/FAQ entrance animations, and filter transitions.
- The tilt is only initialized for `(hover:hover) and (pointer:fine)` and is not enabled on touch-only devices.
- Native scrolling remains in place; no smooth-scroll or scroll-jacking runtime was added.
- No new npm runtime dependency was introduced.

## Reference research

The implementation translates patterns rather than copying site layouts or assets:

- Bettr Academy — user-provided editorial reference: large typographic hierarchy, clear section pacing, and restrained visual storytelling.
- Locomotive / Expedia Group case study — immersive long-scroll storytelling that alternates atmospheric movement with clear product moments: https://locomotive.ca/en/work/expedia-group
- Locomotive / Populous case study — refined motion, clean layouts, and impactful visual content: https://locomotive.ca/en/work/populous
- Framer Academy — animation should communicate hierarchy and interaction state; review timing across breakpoints: https://www.framer.com/academy/lessons/bringing-websites-to-life-with-animation
- Framer Academy — appear, hover, press, loop, drag, scroll, variants, and page transitions as distinct motion tools: https://www.framer.com/academy/lessons/framer-animations-overview
- GSAP ScrollTrigger — viewport triggers, scroll-linked progress, and frame-synchronized scroll effects were reviewed; PIR continues using native IntersectionObserver/RAF: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- web.dev — prefer transform and opacity for high-performance animation and use `will-change` sparingly: https://web.dev/articles/animations-guide
- Chrome for Developers — modern motion guidance, including scroll-driven animation and View Transitions: https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion
- MDN — View Transition API for cross-document navigation: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- MDN — CSS scroll-driven animations: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations
- W3C WAI — interaction-triggered motion should be disableable when non-essential: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions

## Version and cache

- Root platform version: `5.69.0`
- Website package version: `3.23.0`
- Public service-worker cache: `pir-visuals-public-v15`
- Icon cache-busting token: `5690`

## Validation summary

- Website regression: **205/205 passed**.
- Root JavaScript syntax scan: **173 files passed**.
- Website server/model syntax: passed.
- Extracted public UI script syntax: passed.
- CSS parser: **2,393 rules / 6,979 declarations / 0 parse errors**.
- Chromium/Playwright representative shell test: **0 console/page errors**.
- Responsive widths: **320, 360, 390, 414, 430, 768, 1024, 1280, 1440px**; no horizontal overflow and exactly one navigation header at each width.
- Mobile navigation open/close: passed; menu panel remained inside the viewport.
- Media depth: tilt activated on desktop fine pointer and reset on pointer leave.
- Light Mode: heading opacity remained visible and foreground colors resolved to theme-aware values.
- Mobile filters: collapsed by default, expanded on demand, active count updated; without JavaScript, filters remained visible.
- Motion Off: zero hidden reveal targets and navbar animation remained `none`.
- System reduced motion: zero hidden reveal targets, ambient animation `none`, and pointer depth not initialized.
- Full representative-page scroll: zero reveal targets remained hidden.

See `TEST-REPORT-v5.69.0.md` for scope and environment limitations, and `docs/MOTION-DESIGN-REFERENCES-v5.69.0.md` for the reference notes.

## Environment limitations

- Browser QA used a representative fixture built from the actual website shell CSS and extracted `public-ui.js`, not the user's live MongoDB content, uploads, WhatsApp session, or production SMTP credentials.
- `npm run website:test` passed all 205 tests. `npm run check` passed all 173 root JavaScript files. `npm run website:check` passed.
- The root bot test suite was attempted: 350 passed and 6 could not load because `node-fetch` and `mongoose` are not installed in this isolated environment. No bot source files were changed; install project dependencies before running the full bot suite locally.
- Live MongoDB/WhatsApp integration and production deployment were not performed here.

## Installation safety

1. Back up the current project folder.
2. Extract v5.69.0 into a new folder before replacing anything.
3. Preserve the local `.env`, MongoDB database, uploads, backups, and WhatsApp session from the existing project.
4. Run `npm install` from the project root and `npm run website` after dependencies are available.
5. Hard refresh the browser after the website starts.
