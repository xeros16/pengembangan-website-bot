# Motion & UI/UX Reference Notes — PIR Visuals v5.69.0

This note records the external patterns reviewed for the immersive/hybrid direction. The implementation is original to PIR Visuals and does not copy proprietary layouts, code, or artwork.

## Visual references

### Bettr Academy

User-provided visual reference. Used for editorial hierarchy, confident headline scale, deliberate section pacing, and a balance between strong typography and useful content. PIR keeps its own pear identity, forest-green/sage/warm-ivory palette, and marketplace information architecture.

https://bettr.academy/

### Locomotive — Expedia Group

The case study describes an immersive long-scroll experience that lets the audience explore features at their own pace, with atmospheric motion alternating with crisp product moments. PIR applies the pacing idea to homepage storytelling and case-study sections, but keeps native scroll and avoids pinned scroll-jacking.

https://locomotive.ca/en/work/expedia-group

### Locomotive — Populous

The case study emphasizes refined animation, clean layouts, and impactful visual content. PIR translates that into staggered case-study sections, media-led reveal, and consistent spacing rather than reproducing its page design.

https://locomotive.ca/en/work/populous

### Framer Academy — Bringing websites to life with animation

The lesson frames motion as a way to establish hierarchy and clarify interaction. This informed the split between large section entrances and small hover/press feedback, and the need to review a complete page sequence rather than judging isolated animations.

https://www.framer.com/academy/lessons/bringing-websites-to-life-with-animation

### Framer Academy — Animation overview

The overview covers appear, hover, press, loop, drag, scroll, component variants, and page transitions as distinct interaction types. PIR uses a subset suited to its current HTML/CSS architecture: reveal, hover, press, pointer depth, dialog feedback, and existing page transitions.

https://www.framer.com/academy/lessons/framer-animations-overview

## Engineering and accessibility references

### GSAP ScrollTrigger

Reviewed for viewport triggers, scrubbed progress, responsive match-media patterns, and frame-synchronized scroll updates. PIR does not add GSAP; the existing IntersectionObserver and requestAnimationFrame architecture remains in place to avoid a new runtime dependency.

https://gsap.com/docs/v3/Plugins/ScrollTrigger/

### web.dev — High-performance CSS animations

Reinforces the use of transform and opacity for movement/visibility and cautions against layout/paint-heavy animation properties. v5.69 keeps the new effects on transforms/opacity, bounds pointer movement, and avoids permanent `will-change` on every card.

https://web.dev/articles/animations-guide

### Chrome for Developers — Motion guidance

Reviewed for modern scroll-driven effects, View Transitions, and compositor-friendly motion. The current release keeps the existing scroll scheduler and MPA View Transition behavior rather than adding competing scroll listeners.

https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion

### MDN — View Transition API

Provides the model for cross-document page transitions and persistent named elements. v5.69 leaves the single sticky navbar persistent and avoids adding another navbar entrance animation.

https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API

### MDN — CSS scroll-driven animations

Reviewed as a progressive-enhancement option for future scroll-linked visual moments. It was not added as a required dependency or replacement for the existing reveal observer in this release.

https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations

### W3C WAI — Animation from interactions

Explains why non-essential interaction animation should be disableable. v5.69 keeps both the site's Motion Off control and `prefers-reduced-motion`, and makes sure reveal content remains visible when motion is off.

https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions

## v5.69 implementation map

| Reference principle | PIR Visuals implementation |
|---|---|
| Editorial pacing | More reveal targets for category, case-study, support, shortlist, and studio surfaces |
| Distinct interaction states | Focus, press, dialog, FAQ, toast, and mobile filter feedback |
| Media-led storytelling | Bounded pointer tilt on image frames, not on text/card containers |
| Performance discipline | RAF-batched pointer updates; transform/opacity; no new animation runtime |
| Accessible motion | Motion Off, reduced-motion media query, touch-device exclusion |
| Responsive UI | Mobile filter disclosure with active count and no-JS fallback |

## What was intentionally not added

- No third-party smooth-scroll runtime or scroll-jacking.
- No WebGL shader or particle engine; these would add weight and are not required for the current portfolio marketplace.
- No custom cursor replacement that hides the native pointer.
- No forced global border-radius, color, font, or background overrides.
- No additional navbar instance or independent navbar entrance animation.
