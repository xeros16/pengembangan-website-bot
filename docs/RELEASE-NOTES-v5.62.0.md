# PIR Visuals v5.62.0 — Full Platform & Experience Overhaul

## Product direction and reference research
This release uses a synthesis of public design and engineering references rather than cloning a single website. The visual direction combines editorial storytelling and image-led portfolio presentation (Bettr Academy and curated portfolio/agency galleries), purposeful interaction timing and easing (Webflow), interactive product/website examples (Framer), motion hierarchy and user control (Apple Human Interface Guidelines), scroll-trigger patterns (GSAP ScrollTrigger and Locomotive Scroll), and interactive graphic principles (Rive). Performance and accessibility decisions follow web.dev, MDN, WebKit, and Chrome guidance: prefer transform/opacity where practical, avoid gratuitous or excessive motion, respect reduced-motion preferences, and preserve meaningful final states.

Reference sources reviewed:
- Webflow — Interactions and motion design: https://webflow.com/webflow-way/design-systems/interactions
- Framer — Interactive website examples: https://www.framer.com/blog/interactive-websites/
- Stripe Design Language Study — palette, typography, spacing/layout, and motion: https://stripe.design/
- Linear — interface refresh and reducing visual noise: https://linear.app/now/behind-the-latest-design-refresh
- Vercel — Web Interface Guidelines: https://vercel.com/design/guidelines
- Awwwards Site of the Day index — portfolio, animation, typography, and responsive design references: https://esirop.github.io/awwwards-sotd-index/
- Apple — Human Interface Guidelines, Motion: https://developer.apple.com/design/human-interface-guidelines/motion
- GSAP — ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- Locomotive Scroll — viewport detection and parallax: https://scroll.locomotive.ca/docs
- Rive — interactive graphics for websites: https://rive.app/use-cases/websites
- web.dev — high-performance CSS animations: https://web.dev/articles/animations-guide
- MDN — reduced motion accessibility: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion
- Chrome for Developers — modern motion guidance: https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion
- WebKit — responsive design for motion: https://webkit.org/blog/7551/responsive-design-for-motion/
- A1 Gallery — designer portfolio references: https://www.a1.gallery/blog/best-framer-portfolio-websites-2026
- Framer — agency website references: https://www.framer.com/solutions/agencies/

## Whole-site visual system
- Applied a shared visual system through the common website shell so public pages, designer pages, studio, and client workspace share consistent surfaces, focus states, spacing rhythm, and interaction timing.
- Added restrained architectural grid lines and asymmetric orbital background details to both themes. The light theme uses lower-contrast texture to preserve readability; the dark theme retains dimensional surfaces rather than a flat black fill.
- Refined the sticky navigation surface, active-page indication, brand emblem sizing, button states, form focus rings, and responsive mobile navigation spacing.
- Added responsive polish to cards and image-led content without changing stored designer data or existing route behavior.

## Global interactions
- Added a native accessible command palette in the shared shell.
- Open via the navigation button, `Ctrl/Cmd + K`, or `/` when focus is not inside a text field.
- Palette supports live filtering of shortcuts and direct navigation to Discover, Categories, Favorites, Shortlist, Collections, Designer Studio, Client Workspace, and Contact/Support.
- Search submission routes to `/discover` with the entered designer/skill query.
- Added a floating back-to-top control that appears after scrolling and uses native smooth scrolling only when motion is allowed.
- Added active navigation state based on the current path.
- Added native cross-document View Transitions where supported by the browser, with a graceful no-animation path for reduced-motion users.
- Added subtle pointer-position spotlight feedback to relevant cards on fine-pointer desktop devices; not enabled on touch devices.
- Added progressive lazy-image reveal with asynchronous decoding and load/error fallback, including dynamically inserted portfolio content.

## Motion controls and accessibility
- Added a persistent `Motion: On/Off` control to the common navigation. Preference is stored locally in the visitor's browser.
- Operating-system `prefers-reduced-motion` takes precedence; the website does not override that preference.
- Turning motion off makes reveal/story content visible, removes nonessential transitions/animations, and pauses the homepage auto-advancing carousel.
- Preserved keyboard focus visibility, native dialog behavior, Escape-to-close, and screen-reader labels for the command palette and floating controls.
- No external animation runtime, Rive player, GSAP, or Locomotive Scroll dependency was added; this release uses native CSS/browser APIs to avoid unnecessary payload and maintenance overhead.

## Compatibility and preservation
- WhatsApp remains Baileys; website and game remain separate services.
- Existing designer profiles, portfolio uploads, services/pricing, favorites, shortlist, collections/moodboards, reviews, analytics, Designer Studio, Owner dashboard, Client Workspace, and direct client-to-designer contact are preserved.
- No destructive MongoDB schema migration was introduced.
- PWA public cache namespace advanced to `pir-visuals-public-v8`.
- Service worker explicitly excludes `/client` as well as existing private paths from offline caching.
- Website health endpoint reports platform version `5.62.0`; website package version is `3.16.0`.

## Validation
- Root JavaScript syntax check: 173 files passed.
- Website server/model syntax check: passed.
- Website automated tests: 167/167 passed.
- Generated `public-ui.js`: parsed successfully with Node's JavaScript parser.
- Inline website CSS: parsed successfully with tinycss2; zero top-level parser errors.
- Full root test suite: 350/356 passed. Six tests are blocked by unavailable installed dependencies in this build environment (`node-fetch`, `sharp`, and `mongoose`); these are declared in the project package manifest.
- Live MongoDB, SMTP delivery, actual Baileys pairing, and browser end-to-end visual testing were not run in this build environment.

## Version
- Root application: `5.62.0`.
- Website package: `3.16.0`.
