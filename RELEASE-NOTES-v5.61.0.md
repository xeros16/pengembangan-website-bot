# PIR Visuals v5.61.0 — Bettr-inspired Editorial Motion

## Reference direction
The public Bettr Academy homepage was used as a visual/experience reference. The accessible page structure presents a large welcome hero, featured course content, numerical proof points, image-led stories, social-impact messaging and editorial content blocks. PIR Visuals adapts those broad storytelling patterns to its own creative marketplace identity; no Bettr branding, copy, imagery or proprietary assets are reused. The live crawl exposes page content and section structure, not a verified animation source implementation, so this release interprets the requested motion direction rather than claiming a pixel-identical recreation.

## Homepage motion
- Kinetic hero typography: editable CMS title is safely escaped and split into individually animated words while retaining a single accessible `aria-label`.
- Hero intro sequence: overline, headline, supporting copy, actions, index panel and footer enter with a controlled stagger.
- Scroll storytelling: hero index, featured carousel, section headers, categories, talent, selected work, manifesto, join CTA and FAQ blocks reveal as they enter the viewport.
- Staggered cards: category tiles, featured designers and selected portfolio items enter in sequence.
- Portfolio image reveal: project imagery uses a clip-path reveal and subtle scale settling.
- Animated metrics: live designer, verified, open-for-work and featured totals count up with eased timing and Indonesian number formatting.
- Editorial ribbon: continuous horizontal brand statement ticker, with pause-on-hover.
- Hero parallax: subtle scroll offset and pointer-responsive ambient light.
- Featured carousel: image drift/zoom and staggered kicker, label, headline, description and CTA transitions.
- Manifesto side label remains sticky on larger screens to create a restrained chapter/storytelling effect.

## Accessibility and performance
- No third-party animation framework or remote animation assets were added.
- IntersectionObserver is used for viewport reveals; static content remains visible when unsupported.
- `prefers-reduced-motion` disables nonessential movement and reveals content immediately.
- Headline remains accessible as one phrase; animated word spans are hidden from assistive technology.
- Existing swipe, keyboard carousel, favorite/shortlist toast, scroll progress and client workspace interactions remain available.
- Service worker public cache namespace advanced to `pir-visuals-public-v7`.

## Version
- Root application: `5.61.0`.
- Website package: `3.15.0`.

## Validation
- Root JavaScript syntax check: 173 files passed.
- Website server/model syntax check: passed.
- Website automated tests: 159/159 passed.
- Generated public browser JavaScript: parsed successfully.
- Inline website CSS: 1,518 top-level rules parsed with zero errors.
- Full root test suite previously reports 350/356; six tests remain blocked by missing `node-fetch` and `mongoose` dependencies in this build environment.
- Browser screenshot, live database and production email delivery tests require the deployment environment and were not run here.
